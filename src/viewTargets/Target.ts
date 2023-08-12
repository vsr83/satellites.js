// Target info is initially parsed to numbers and strings.
export type TargetInfoField =  number | string;

export type TargetInfo = {
    [key : string] : TargetInfoField;
};

export type TargetInfoCollection = {
    [key : string] : TargetInfo
};

/**
 * Class for the storage of targets.
 */
export class TargetCollection
{
    // JSON Field name used for unique identification of targets.
    keyField : string;

    // The target data stored as an object. 
    // This essentially functions as a Map<string, Object> from the key field to a JSON.
    data : TargetInfoCollection;

    /**
     * Public constructor
     * 
     * @param {string} keyField 
     *      JSON field name used for unique identification of targets.
     */
    constructor(keyField : string)
    {
        this.keyField = keyField;
        this.data = {};
    }

    /**
     * Get key from a target.
     * 
     * @param {TargetInfo} target 
     *      Target information.
     * @throws {Error} If target does not have the key field.
     * @returns {TargetInfoField} The key.
     */
    getKey(target : TargetInfo) : TargetInfoField
    {
        if (!(this.keyField in target))
        {
            throw Error("TargetInfo does not contain \"" + this.keyField + "\"!");
        }

        return target[this.keyField];
    }

    /**
     * Check whether a target is part of the list.
     * 
     * @param {TargetInfoField} key 
     *      Target name.
     * @returns 
     */
    containsKey(key : TargetInfoField) : boolean
    {
        return (key in this.data);
    }

    /**
     * Add target to the list.
     * 
     * @param {TargetInfo} target 
     *      Target info.
     */
    addTarget(target : TargetInfo) 
    {
        const key : TargetInfoField = this.getKey(target);

        if (this.containsKey(key))
        {
            throw Error("TargetCollection already contains target \"" + key + "\"!");
        }

        this.data[key] = target;
    }

    /**
     * Remove target from the list by key.
     * 
     * @param {TargetInfoField} key 
     *      The key
     * @throws {Error} If the collection does not include target matching the key.
     */
    removeTarget(key : TargetInfoField)
    {
        if (!this.containsKey(key))
        {
            throw Error("TargetCollection does not contain target \"" + key + "\"!");
        }

        delete this.data[key];
    }

    /**
     * Check whether a target is part of the list.
     * 
     * @param {TargetInfoField} key 
     *      Target name.
     * @throws {Error} If the target does not contain the field used as a key.
     * @returns {boolean} Whether the target is part of the list.
     */
    containsTarget(target : TargetInfo) : boolean
    {
        if (!(this.keyField in target))
        {
            throw Error("TargetInfo does not contain the key field!");
        }

        return (target[this.keyField] in this.data);
    }

    /**
     * Get target info by a key.
     * 
     * @param {TargetInfoField} key 
     *      The key.
     * @throws {Error} If the collection does not include target matching the key.
     * @returns {TargetInfo} Target info.
     */
    getTarget(key : TargetInfoField) : TargetInfo
    {
        if (!this.containsKey(key))
        {
            throw Error("TargetCollection does not contain target \"" + key + "\"!");
        }

        return this.data[key];
    }

    /**
     * Get all target list keys.
     * 
     * @returns {TargetInfoField[]} The keys.
     */
    getKeys() : TargetInfoField[] 
    {
        return Object.keys(this.data);
    }

    /**
     * Get all targets as an array.
     * 
     * @returns {TargetInfo[]} Get target list contents.
     */
    getTargets() : TargetInfo[]
    {
        const targetList : TargetInfo[] = [];
        const keyList : TargetInfoField[] = this.getKeys(); 

        for (let indKey = 0; indKey < keyList.length; indKey++)
        {
            const key = keyList[indKey];
            targetList.push(this.data[key]);
        }

        return targetList;
    }

    /**
     * Get the number of targets in the collection.
     * 
     * @return {number} The number of targets.
     */
    getLength() : number 
    {
        return Object.keys(this.data).length;
    }

    /**
     * Clear the collection.
     */
    clear()
    {
        const keys : TargetInfoField[] = this.getKeys();

        for (let indKey = 0; indKey < keys.length; indKey++)
        {
            const key = keys[indKey];
            delete this.data[key];
        }
    }
}