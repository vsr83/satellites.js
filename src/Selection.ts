import { Dataset } from "./viewTargets/Dataset";

/**
 * Class implementing target selection.
 */
export class Selection {
    /**
     * Public constructor.
     * 
     * @param {Dataset} dataset
     *      Dataset the selection references.
     */
    constructor(dataset : Dataset) 
    {
        this.dataset = dataset;
    }

    /**
     * Set selection.
     * 
     * @param {string[[]]} targetNames 
     *      List of targets in the selection.
     */
    setSelection(targetNames : string[]) 
    {
        this.selectionTargets = targetNames;
    }

    /**
     * Get selection.
     * 
     * @returns {string[]} List of targets in the selection.
     */
    getSelection() : string[] 
    {
        return this.selectionTargets;
    }

    /**
     * Refresh selection in case the dataset has changed.
     */
    refresh() 
    {
        const newSelection : string[] = [];

        for (let targetName in this.selectionTargets) 
        {
            if (this.dataset.hasTarget(targetName)) 
            {
                newSelection.push(targetName);
            }
        }

        this.selectionTargets = newSelection;
    }

    /**
     * Get dataset.
     * 
     * @returns {Dataset} The dataset.
     */
    getDataset() : Dataset
    {
        return this.dataset;
    }

    // The dataset the selection refers to.
    private dataset : Dataset;

    // State of the selection.
    private selectionTargets : string[];
};