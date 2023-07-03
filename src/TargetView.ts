import { TargetCollection, TargetInfo, TargetInfoCollection, TargetInfoField } from "./Target";

/**
 * Class implementing the internals of the target list dialog.
 */
export class TargetView
{
    // DOM elements used by the target list.
    elementListTable : HTMLTableElement;
    elementSelectionTable : HTMLTableElement;
    elementClearButton : Element;
    elementSelectAllButton : Element;
    elementFilterText : HTMLInputElement;
    elementSelectionCount : HTMLElement;

    // Column index of the column used as a key for unique identification of targets.
    filterIndex : number;
    // Columns included in the lists.
    columns : string[];
    // TBD: Remove?
    rowToKey : TargetInfoField[];

    // Target collection for all possible targets.
    targetCollection : TargetCollection;
    // Target collection for the selection.
    selectionCollection : TargetCollection;
    listBody : HTMLTableSectionElement;
    selectBody : HTMLTableSectionElement;

    /**
     * Public constructor.
     * 
     * @param {Element} elementListTable 
     *      DOM element for the target list table.
     * @param {Element} elementSelectionTable 
     *      DOM element for the target selection list.
     * @param {Element} elementClearButton 
     *      DOM element for the selection list clear button.
     * @param {Element} elementSelectAllButton 
     *      DOM element for the select all button.
     * @param {Element} elementFilterText 
     *      DOM element for the filtering text field.
     * @param {Element} elementSelectionCount 
     *      DOM element for the selectionCount.
     * @param {string[]} columns
     *      Column fields.
     * @param {number} filterIndex
     *      Index of the column used for filtering.
     */
    constructor(elementListTable : Element, 
        elementSelectionTable : Element,
        elementClearButton : Element,
        elementSelectAllButton : Element,
        elementFilterText : Element,
        elementSelectionCount : Element,
        columns : string[],
        filterIndex : number)
    {
        this.elementListTable = <HTMLTableElement>elementListTable;
        this.elementSelectionTable = <HTMLTableElement>elementSelectionTable;
        this.elementClearButton = elementClearButton;
        this.elementSelectAllButton = elementSelectAllButton;
        this.elementFilterText = <HTMLInputElement> elementFilterText;
        this.elementSelectionCount = <HTMLElement> elementSelectionCount;
        this.columns = columns;
        this.filterIndex = filterIndex;
        this.rowToKey = [];
        this.targetCollection = new TargetCollection(this.columns[this.filterIndex]);
        this.selectionCollection = new TargetCollection(this.columns[this.filterIndex]);

        this.elementFilterText.addEventListener("keyup", this.textOnKeyUp.bind(this));
        this.elementClearButton.addEventListener("click", this.clearSelection.bind(this));
        this.elementSelectAllButton.addEventListener("click", this.tryAddAll.bind(this));
      
        const tableHeadList : HTMLTableSectionElement = this.elementListTable.createTHead();
        const headRowList : HTMLTableRowElement = tableHeadList.insertRow();

        const tableHeadSelection : HTMLTableSectionElement = this.elementSelectionTable.createTHead();
        const headRowSelection : HTMLTableRowElement = tableHeadSelection.insertRow();

        for (let indField = 0; indField < columns.length; indField++)
        {
            const fieldName : string = columns[indField];

            const newCellList : HTMLTableCellElement = headRowList.insertCell();
            let newTextList : Text = document.createTextNode(fieldName);
            newCellList.appendChild(newTextList);

            const newCellSelection : HTMLTableCellElement = headRowSelection.insertCell();
            let newTextSelection : Text = document.createTextNode(fieldName);
            newCellSelection.appendChild(newTextSelection);
        }

        this.listBody = this.elementListTable.createTBody();
        this.selectBody = this.elementSelectionTable.createTBody();
    }
    
    /**
     * Load target data.
     * 
     * @param {TargetInfo[]} data 
     *      Array of targets.
     */
    loadData(data : TargetInfo[])
    {
        this.targetCollection.clear();
        this.rowToKey = [];

        // Clear table bodies.
        const numRowsList : number = this.listBody.rows.length;
        for (let indRow = 0; indRow < numRowsList; indRow++)
        {
            this.listBody.deleteRow(-1);
        }
        const numRowsSelection : number = this.selectBody.rows.length;
        for (let indRow = 0; indRow < numRowsSelection; indRow++)
        {
            this.selectBody.deleteRow(-1);
        }

        function createTargetListClickHandler(key : TargetInfoField)
        {
            return function()
            {
                this.tryAddSelection(key);
            }
        }

        for (let indTarget = 0; indTarget < data.length; indTarget++)
        {
            this.targetCollection.addTarget(data[indTarget]);

            // Fill target list:
            const item : TargetInfo = data[indTarget];
            const row : HTMLTableRowElement = this.listBody.insertRow();
            
            for (let indField = 0; indField < this.columns.length; indField++)
            {
                const fieldName = this.columns[indField];
                const newCell = row.insertCell();
                let newText = document.createTextNode(item[fieldName].toString());
                newCell.appendChild(newText);
            }

            const key = item[this.columns[this.filterIndex]];
            this.rowToKey.push(item[this.columns[this.filterIndex]]);

            row.addEventListener("click", createTargetListClickHandler(key).bind(this));
        }

        this.updateSelectionCount();
    }

    /**
     * Try adding a target to selection list. If target already exists, nothing
     * is added.
     * 
     * @param {TargetInfo} targetInfo 
     *      Target info.
     */
    tryAddSelection(targetKey : TargetInfoField)
    {
        function createSelectionListClickHandler(key : TargetInfoField)
        {
            return function()
            {
                this.tryRemoveSelection(key);
            }
        }

        if (!this.selectionCollection.containsKey(targetKey))
        {
            const targetInfo : TargetInfo = this.targetCollection.getTarget(targetKey);
            this.selectionCollection.addTarget(targetInfo);

            const row : HTMLTableRowElement = this.selectBody.insertRow();

            for (let indField = 0; indField < this.columns.length; indField++)
            {
                const fieldName = this.columns[indField];
                const newCell = row.insertCell();
                let newText = document.createTextNode(targetInfo[fieldName].toString());
                newCell.appendChild(newText);
            }

            const key = targetInfo[this.columns[this.filterIndex]];
            row.addEventListener("click", createSelectionListClickHandler(key).bind(this));
        }
        this.updateSelectionCount();
    }

    /**
     * Try removing a target from the selection list. If the target is not in
     * the list, nothing is removed.
     * 
     * @param {TargetInfoField} targetKey 
     *      Target key.
     */
    tryRemoveSelection(targetKey : TargetInfoField)
    {
        if (this.selectionCollection.containsKey(targetKey))
        {
            this.selectionCollection.removeTarget(targetKey);

            // Remove the row element.
            for (let row = 0; row < this.selectBody.rows.length; row++)
            {
                const rowElem : HTMLTableRowElement = this.selectBody.rows[row];
                const colElement : HTMLTableCellElement = rowElem.getElementsByTagName("td")[this.filterIndex];

                if (colElement) 
                {
                    const txtValue : string = colElement.textContent || colElement.innerText;

                    if (targetKey.toString() === txtValue)
                    {
                        rowElem.remove();
                    }
                }
            }
        }
        this.updateSelectionCount();
    }

    /**
     * Try adding all filtered targets in the target list to the selection.
     */
    tryAddAll()
    {
        const keys : TargetInfoField[] = this.targetCollection.getKeys();
        const filterText = this.elementFilterText.value.toUpperCase();

        for (let indKey = 0; indKey < keys.length; indKey++)
        {
            const key : TargetInfoField = keys[indKey];

            if (key.toString().toUpperCase().indexOf(filterText) > -1) 
            {
                this.tryAddSelection(key);
            }
        }

        this.updateSelectionCount();
    }

    /**
     * Clear selection.
     */
    clearSelection() 
    {
        this.selectionCollection.clear();

        const numRowsList : number = this.selectBody.rows.length;
        for (let indRow = 0; indRow < numRowsList; indRow++)
        {
            this.selectBody.deleteRow(-1);
        }

        this.updateSelectionCount();
    }

    /**
     * Update selection count text.
     */
    updateSelectionCount()
    {
        const numTargets = this.targetCollection.getLength();
        const numSelected = this.selectionCollection.getLength();

        this.elementSelectionCount.innerText = numSelected + " out of " + numTargets + " targets selected";
    }

    /**
     * Callback for the filter text field keyboard input.
     */
    textOnKeyUp()
    {
        const filterText = this.elementFilterText.value.toUpperCase();

        const rowElements : HTMLCollection = this.elementListTable.getElementsByTagName("tr");

        for (let rowIndex = 0; rowIndex < rowElements.length; rowIndex++) 
        {
            const colElement : HTMLTableCellElement = rowElements[rowIndex].getElementsByTagName("td")[this.filterIndex];

            if (colElement) 
            {
                const txtValue : string = colElement.textContent || colElement.innerText;

                if (txtValue.toUpperCase().indexOf(filterText) > -1) 
                {
                    (<HTMLElement> rowElements[rowIndex]).style.display = "";
                } else {
                    (<HTMLElement> rowElements[rowIndex]).style.display = "none";
                }
            }       
        }
    }

    /**
     * Get DOM element for the target list table.
     * 
     * @returns {Element} The DOM element.
     */
    getElementListTable() : Element 
    {
        return this.elementListTable;
    }

    /**
     * Get DOM element for the selection table.
     * 
     * @returns {Element} The DOM element.
     */
    getElementSelectionTable() : Element 
    {
        return this.elementSelectionTable;
    }

    /**
     * Get DOM element for the clear button.
     * 
     * @returns {Element} The DOM element.
     */
    getElementClearButton() : Element 
    {
        return this.elementClearButton;
    }

    /**
     * Get DOM element for the select all button.
     * 
     * @returns {Element} The DOM element.
     */
    getElementSelectAllButton() : Element 
    {
        return this.elementSelectAllButton;
    }

    /**
     * Get DOM element for the filter text box.
     * 
     * @returns {Element} The DOM element.
     */
    getElementFilterText() : Element 
    {
        return this.elementFilterText;
    }
}