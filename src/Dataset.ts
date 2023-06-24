import { TargetCollection, TargetInfoField } from "./Target";
import { Tle } from "./Tle";

export type FleetCollection = {
    [key : string] : TargetCollection
};

/**
 * Class for the dataset of all targets.
 */
export class Dataset  
{
    fleetCollection : FleetCollection;
    keyField : string;

    constructor(keyField : string)
    {
        this.fleetCollection = {};
        this.keyField = keyField;
    }

    addTle(tle : Tle, fleet : string)
    {

    }

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
                const sourceFleet : TargetCollection = TargetCollection[sourceFleetName];
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
     * Export dataset to a JSON string.
     * 
     * @returns {string} The JSON string.
     */
    exportToJson() : string
    {
        const jsonOut = {};

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