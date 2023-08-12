import { TargetCollection, TargetInfoField, TargetInfo } from "./Target";
import { Tle } from "../Tle";

export type FleetCollection = {
    [key : string] : TargetCollection
};

/**
 * Class for the dataset of all targets.
 */
export class Dataset  
{
    private fleetCollection : FleetCollection;
    keyField : string;

    constructor(keyField : string)
    {
        this.fleetCollection = {};
        this.keyField = keyField;
    }

    /**
     * Add TLE to the dataset.
     * 
     * @param {Tle} tle 
     *      TLE as an Tle object.
     * @param {string} fleetName 
     *      Name of the fleet.
     */
    addTle(tle : Tle, fleetName : string)
    {
        if (fleetName in this.fleetCollection)
        {
            const targetInfo : TargetInfo = tle.toJson();
            this.fleetCollection[fleetName].addTarget(tle.toJson());
        }
    }

    /**
     * Add Orbit State Vector to the dataset.
     * 
     * @param {string} fleet 
     */
    addOsv(fleet : string)
    {
        // TODO
    }

    addKepler(fleet : string)
    {
        // TODO
    }

    /**
     * Clear all targets from all fleets.
     */
    clear()
    {
        for (const [fleetName, fleet] of Object.entries(this.fleetCollection)) 
        {
            delete this.fleetCollection[fleetName];
        }
    }

    /**
     * Add an empty fleet.
     * 
     * @param {string} fleetName
     *      Name of the fleet.
     * @returns {boolean} If the does not exist.
     */
    addFleet(fleetName : string) : boolean
    {
        if (fleetName in this.fleetCollection)
        {
            return false;
        }
        else 
        {
            this.fleetCollection[fleetName] = new TargetCollection(this.keyField);

            return true;
        }
    }

    /**
     * Remove fleet.
     * 
     * @param {string} fleetName
     *      Name of the fleet.
     * @returns {boolean} If the fleet existed.
     */
    removeFleet(fleet : string) : boolean
    {
        if (fleet in this.fleetCollection)
        {
            delete this.fleetCollection[fleet];
            return true;
        }
        else 
        {
            return false;
        }
    }

    /**
     * Remove fleet.
     * 
     * @param {string} fleet 
     *      Name of the fleet.
     */
    hasFleet(fleet : string) : boolean
    {
        return fleet in this.fleetCollection;
    }

    /**
     * Get fleet.
     * 
     * @param {string} fleet 
     *      Fleet name.
     * @returns {TargetCollection} The fleet data.
     */
    getFleet(fleet : string) : TargetCollection
    {
        if (this.hasFleet(fleet))
        {
            return this.fleetCollection[fleet];
        }
        else 
        {
            throw Error("Fleet \"" + fleet + "\" does not exist!");
        }
    }

    /**
     * Get list of fleet names.
     * 
     * @returns {string[]} The list.
     */
    getFleetNames() : string[]
    {
        return Object.keys(this.fleetCollection);
    }

    /**
     * Remove target from all fleets.
     * 
     * @param {string} target 
     *      Target name.
     * @returns {boolean} Whether the target was found.
     */
    removeTarget(target : TargetInfoField) : boolean
    {
        let found : boolean = false;

        for (const [fleetName, fleet] of Object.entries(this.fleetCollection)) 
        {
            if (fleet.containsKey(target))
            {
                fleet.removeTarget(target);
                found = true;
            }
        }

        return found;
    }

    /**
     * Move target between two fleets.
     * 
     * @param {string} targetName 
     *      Target name.
     * @param {string} sourceFleetName 
     *      Source fleet name.
     * @param {string} targetFleetName 
     *      Target fleet name.
     * @returns {boolean} If the fleets and the target are found.
     */
    moveTarget(targetName : string, sourceFleetName : string, targetFleetName : string) : boolean
    {
        let success = false;

        if ((sourceFleetName in this.fleetCollection) && (targetFleetName in this.fleetCollection)
            && sourceFleetName != targetFleetName)
        {
            const sourceFleet : TargetCollection = this.fleetCollection[sourceFleetName];
            const targetFleet : TargetCollection = this.fleetCollection[targetFleetName];

            if (targetName in this.fleetCollection[sourceFleetName])
            {
                targetFleet.addTarget(sourceFleet.getTarget(targetName));
                sourceFleet.removeTarget(targetName);
            }
        }

        return success;
    }

    /**
     * Aggregate multiple fleets into one.
     * 
     * @param {string} targetFleetName 
     *      Name of the target fleet. If it does not exist, it is filled.
     * @param {string[]} fleetList 
     *      Names of the source fleets.
     */
    aggregateFleets(targetFleetName : string, fleetList : string[])
    {
        if (!(targetFleetName in this.fleetCollection))
        {
            this.fleetCollection[targetFleetName] = new TargetCollection(this.keyField);
        }

        const targetFleet : TargetCollection = this.fleetCollection[targetFleetName];

        for (let indFleet = 0; indFleet < fleetList.length; indFleet++)
        {
            const sourceFleetName : string = fleetList[indFleet];

            if (targetFleetName == sourceFleetName)
            {
                continue;
            }

            if (sourceFleetName in this.fleetCollection)
            {
                const sourceFleet : TargetCollection = this.fleetCollection[sourceFleetName];
                const keys : TargetInfoField[] = sourceFleet.getKeys();

                for (let indKey = 0; indKey < keys.length; indKey++)
                {
                    const key : TargetInfoField = keys[indKey];
                    let target = sourceFleet.getTarget(key);

                    targetFleet.addTarget(target);
                    sourceFleet.removeTarget(key);
                }

                delete this.fleetCollection[sourceFleetName];
            }
        } 
    }

    /**
     * Get target by key.
     * 
     * @param {string} key 
     * @returns {TargetInfo} Target info JSON.
     */
    getTarget(key : string) : TargetInfo | null
    {
        const fleetList : string[] = Object.keys(this.fleetCollection);

        for (let indFleet = 0; indFleet < fleetList.length; indFleet++)
        {
            const fleetName : string = fleetList[indFleet];
            const collection : TargetCollection = this.fleetCollection[fleetName];

            if (collection.containsKey(key))
            {
                return collection.getTarget(key);
            }
        }
        return null;
    }

    /**
     * Export dataset to a JSON string.
     * 
     * @returns {string} The JSON string.
     */
    exportToJson() : string
    {
        const jsonOut : any = {};

        for (const [fleetName, fleet] of Object.entries(this.fleetCollection)) 
        {
            jsonOut[fleetName] = fleet.data;
        }

        return JSON.stringify(jsonOut);
    }

    /**
     * Import dataset from a JSON string.
     * @param json 
     */
    importFromJson(json : string)
    {
        const dataset = JSON.parse(json);
    }
};