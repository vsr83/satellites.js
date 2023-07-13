import { TargetCollection, TargetInfo, TargetInfoCollection, TargetInfoField } from "./Target";
import { Dataset } from "./Dataset";
import { Tle } from "./Tle";
import { IVisibility } from "./IVisibility";

/**
 * Class implementing the internals of the dataset dialog.
 */
export class DatasetView implements IVisibility
{
    private elementDialog              : HTMLElement;
    private elementCloseButton         : HTMLElement;

    // Fleet Selection fieldset elements.
    private elementFleetSelect         : HTMLSelectElement;
    private elementFleetAddButton      : HTMLElement;
    private elementFleetRemoveButton   : HTMLElement;
    private elementFleetNumLabel       : HTMLElement;

    // Add Data fieldset elements.
    private elementAddDataTleButton    : HTMLElement;
    private elementAddDataOsvButton    : HTMLElement;
    private elementAddDataKeplerButton : HTMLElement;
    private elementAddDataJsonButton   : HTMLElement;

    // Targets fieldset elements.
    private elementTargetsFilter       : HTMLInputElement;
    private elementTargetsDeleteButton : HTMLElement;
    private elementTargetsFilterButton : HTMLElement;
    private elementTargetsClearButton  : HTMLElement;
    //private elementTargetsMoveButton   : HTMLElement;
    //private elementTargetsEditButton   : HTMLElement;
    private elementTargetsListTable    : HTMLTableElement;
    private elementTargetsListBody     : HTMLTableSectionElement;

    // Target JSON fieldset elements
    private elementDatasetText : HTMLTextAreaElement;

    // TLE list dialog elements.
    private elementTleContainer    : HTMLElement;
    private elementTleListInput    : HTMLTextAreaElement;
    private elementTleEnterButton  : HTMLElement;
    private elementTleCancelButton : HTMLElement;

    // The current fleet.
    private currentFleet : string;

    // The current target.
    private currentTarget : string;

    // The dataset the view is representing.
    private dataset : Dataset;

    // Two events created for the dialog.
    private eventUpdateDataset   : Event;
    private eventCloseDialog     : Event;

    constructor(dataset : Dataset)
    {
        this.dataset = dataset;
    }

    setTleElements(elementTlecontainer : string, 
        elementTleListInput : string,
        elementTleEnterButton : string,
        elementTleCancelButton : string)
    {
        function getElement(id : string) : HTMLElement
        {
            const elem : HTMLElement | null = document.getElementById(id);
            if (elem === null)
            {
                throw Error("Element \"" + id + "\" not found!");
            }
            return elem;
        }
        try 
        {
            this.elementTleContainer = getElement(elementTlecontainer);
            this.elementTleListInput = <HTMLTextAreaElement>getElement(elementTleListInput);
            this.elementTleEnterButton = getElement(elementTleEnterButton);
            this.elementTleCancelButton = getElement(elementTleCancelButton);
        }
        catch (e : any)
        {
            throw e;
        }
        this.elementTleEnterButton.addEventListener("click", this.tleDialogEnter.bind(this));
        this.elementTleCancelButton.addEventListener("click", this.tleDialogCancel.bind(this));

    }

    /**
     * Handle Enter button click.
     */
    tleDialogEnter()
    {
        console.log("tleDialogEnter");
        this.elementTleContainer.style.visibility = "hidden";

        const tleData : string = this.elementTleListInput.value;
        const lines : string[] = tleData.split('\n');
        const numElem : number = Math.floor(lines.length / 3);

        for (let indElem = 0; indElem < numElem; indElem++)
        {
            const tleLines : string[] = [
                lines[indElem * 3], lines[indElem * 3 + 1], lines[indElem * 3 + 2]
            ];
            const tle : Tle = Tle.fromLines(tleLines);
            const json : TargetInfo = tle.toJson();

            const fleetData : TargetCollection = this.dataset.getFleet(this.currentFleet);
            if (!tle.checkSumValid)
            {
                console.log("Target " + json.OBJECT_ID + " has invalid checksum.");
            }
            else if (fleetData.containsTarget(json))
            {
                console.log("Target " + json.OBJECT_ID + " already contained in the dataset.");
            }
            else 
            {
                fleetData.addTarget(json);
            }
        }

        this.elementTleListInput.value = "";
        this.update();
    }

    /**
     * Handle Cancel button click.
     */
    tleDialogCancel()
    {
        console.log("tleDialogCancel");
        this.elementTleContainer.style.visibility = "hidden";
        this.elementTleListInput.value = "";
    }

    /**
     * Set HTML element ids for all dialog elements.
     * @param {string} elementDialog
     *      Element id.
     * @param {string} elementCloseButton
     *      Element id.
     * @param {string} elementFleetSelect 
     *      Element id.
     * @param {string} elementFleetAddButton 
     *      Element id.
     * @param {string} elementFleetRemoveButton 
     *      Element id.
     * @param {string} elementFleetNumLabel
     *      Element id.
     * @param {string} elementAddDataTleButton 
     *      Element id.
     * @param {string} elementAddDataOsvButton 
     *      Element id.
     * @param {string} elementAddDataKeplerButton 
     *      Element id.
     * @param {string} elementAddDataJsonButton 
     *      Element id.
     * @param {string} elementTargetsFilter 
     *      Element id.
     * @param {string} elementTargetsDeleteButton 
     *      Element id.
     * @param {string} elementTargetsMoveButton 
     *      Element id.
     * @param {string} elementTargetsEditButton 
     *      Element id.
     * @param {string} elementTargetsListTable 
     *      Element id.
     * @throws {Error} If one of the element ids cannot be found.
     */
    setElements(elementDialog      : string,
        elementCloseButton         : string,
        elementFleetSelect         : string,
        elementFleetAddButton      : string,
        elementFleetRemoveButton   : string,
        elementFleetNumLabel       : string,
        elementAddDataTleButton    : string,
        elementAddDataOsvButton    : string,
        elementAddDataKeplerButton : string,
        elementAddDataJsonButton   : string,
        elementTargetsFilter       : string,
        elementTargetsFilterButton : string,
        elementTargetsDeleteButton : string,
        elementTargetsClearButton  : string,
        elementTargetsListTable    : string,
        elementDatasetText         : string)
    {
        function getElement(id : string) : HTMLElement
        {
            const elem : HTMLElement | null = document.getElementById(id);
            if (elem === null)
            {
                throw Error("Element \"" + id + "\" not found!");
            }

            return elem;
        }

        try
        {
            this.elementDialog = getElement(elementDialog);
            this.elementCloseButton = getElement(elementCloseButton);
            this.elementFleetSelect = <HTMLSelectElement> getElement(elementFleetSelect);
            this.elementFleetAddButton = getElement(elementFleetAddButton);
            this.elementFleetRemoveButton = getElement(elementFleetRemoveButton);
            this.elementFleetNumLabel = getElement(elementFleetNumLabel);
            this.elementAddDataTleButton = getElement(elementAddDataTleButton);
            this.elementAddDataJsonButton = getElement(elementAddDataTleButton);
            this.elementAddDataOsvButton = getElement(elementAddDataOsvButton);
            this.elementAddDataKeplerButton = getElement(elementAddDataKeplerButton);
            this.elementAddDataJsonButton = getElement(elementAddDataJsonButton);
            this.elementTargetsFilter = <HTMLInputElement> getElement(elementTargetsFilter);
            this.elementTargetsFilterButton = getElement(elementTargetsFilterButton);
            this.elementTargetsDeleteButton = getElement(elementTargetsDeleteButton);
            this.elementTargetsClearButton = getElement(elementTargetsClearButton);
            //this.elementTargetsMoveButton = getElement(elementTargetsMoveButton);
            //this.elementTargetsEditButton = getElement(elementTargetsEditButton);
            this.elementTargetsListTable = <HTMLTableElement> getElement(elementTargetsListTable);
            this.elementDatasetText = <HTMLTextAreaElement>getElement(elementDatasetText);
        }
        catch (E : any)
        {
            throw E;
        }
        this.elementCloseButton.addEventListener("click", this.hide.bind(this));
        
        this.elementFleetSelect.addEventListener("change", this.fleetSelect.bind(this));
        this.elementFleetAddButton.addEventListener("click", this.fleetAdd.bind(this));
        this.elementFleetRemoveButton.addEventListener("click", this.fleetRemove.bind(this));
        this.elementAddDataTleButton.addEventListener("click", this.addDataTle.bind(this));
        this.elementAddDataJsonButton.addEventListener("click", this.addDataJson.bind(this));
        this.elementAddDataOsvButton.addEventListener("click", this.addDataOsv.bind(this));
        this.elementAddDataKeplerButton.addEventListener("click", this.addDataKepler.bind(this));

        this.elementTargetsDeleteButton.addEventListener("click", this.targetsDelete.bind(this));
        this.elementTargetsFilterButton.addEventListener("click", this.targetsFilter.bind(this));
        this.elementTargetsClearButton.addEventListener("click", this.fleetClear.bind(this));
        //this.elementTargetsMoveButton.addEventListener("click", this.targetsMove.bind(this));
        //this.elementTargetsEditButton.addEventListener("click", this.targetsEdit.bind(this));

        this.elementTargetsFilter.addEventListener("keyup", this.textOnKeyUp.bind(this));

        this.eventCloseDialog = new Event("closeDialog", {});
        this.eventUpdateDataset = new Event("updateDataset", {});

        this.elementTargetsListBody = this.elementTargetsListTable.createTBody();
        this.fleetSelect();
    }

    isVisible()
    {
        return (this.elementDialog.style.visibility === "visible");
    }

    /**
     * Show the dialog.
     */
    show()
    {
        this.elementDialog.style.visibility = "visible";
    }

    /**
     * Hide the dialog. Typically from pressing the Close button.
     */
    hide()
    {
        this.elementDialog.style.visibility = "hidden";
        this.elementDialog.dispatchEvent(this.eventCloseDialog);
    }

    /**
     * Update the target info to contain the JSON for a target.
     * 
     * @param {string} fleet 
     *      Fleet name.
     * @param {string} target 
     *      Target name.
     */
    selectTarget(fleet : string, target : string)
    {
        console.log("selectTarget " + fleet + " " + target);

        const targetStr : string = JSON.stringify(this.dataset.getFleet(fleet).getTarget(target)).replace(/\,/gi, ",&#10;");
        this.elementDatasetText.innerHTML = targetStr;
    }

    /**
     * Select filtered targets from the selected dataset.
     */
    targetsFilter()
    {
        const filterText = this.elementTargetsFilter.value.toUpperCase();

        const rowElements : HTMLCollection = this.elementTargetsListBody.getElementsByTagName("tr");
        const targets : TargetCollection = this.dataset.getFleet(this.currentFleet);

        for (let rowIndex = 0; rowIndex < rowElements.length; rowIndex++) 
        {
            const targetName : string = rowElements[rowIndex].getElementsByTagName("td")[0].innerText;
            const colElement : HTMLTableCellElement = rowElements[rowIndex].getElementsByTagName("td")[1];

            if (colElement) 
            {
                const txtValue : string = colElement.textContent || colElement.innerText;

                if (txtValue.toUpperCase().indexOf(filterText) > -1) 
                {
                } else {
                    targets.removeTarget(targetName);
                }
            }       
        }
        this.update();
    }

    /**
     * Delete target.
     * 
     * @param {string} fleet 
     *      Fleet name.
     * @param {string} target 
     *      Target name.
     */
    deleteTarget(fleet : string, target : string)
    {
        console.log("deleteTarget " + fleet + " " + target);

        // Remove the row element.
        for (let row = 0; row < this.elementTargetsListBody.rows.length; row++)
        {
            const rowElem : HTMLTableRowElement = this.elementTargetsListBody.rows[row];
            const colElement : HTMLTableCellElement = rowElem.getElementsByTagName("td")[0];

            if (colElement) 
            {
                const txtValue : string = colElement.textContent || colElement.innerText;

                if (target.toString() === txtValue)
                {
                    rowElem.remove();
                    break;
                }
            }
        }

        this.dataset.getFleet(fleet).removeTarget(target);
        this.elementDialog.dispatchEvent(this.eventUpdateDataset);
        this.updateCount();
    }

    /**
     * Callback for the filter text field keyboard input.
     */
    textOnKeyUp()
    {
        const filterText = this.elementTargetsFilter.value.toUpperCase();

        const rowElements : HTMLCollection = this.elementTargetsListBody.getElementsByTagName("tr");

        for (let rowIndex = 0; rowIndex < rowElements.length; rowIndex++) 
        {
            const colElement : HTMLTableCellElement = rowElements[rowIndex].getElementsByTagName("td")[1];

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
     * Update the target list to match the current fleet data.
     */
    update()
    {
        function createTargetListClickHandler(key : TargetInfoField)
        {
            return function()
            {
                if (this.elementTargetsDeleteButton.checked)
                {
                    console.log("Delete " + key);
                    this.deleteTarget(this.currentFleet, key);
                }
                else 
                {
                    console.log("Select " + key);
                    this.selectTarget(this.currentFleet, key);
                    //this.tryAddSelection(key);
                }
            }
        }        
        
        // Clear the targets table.
        const rows = this.elementTargetsListBody.rows;
        
        // rows.length will change value during the loop.
        const numRows = rows.length;

        for (let indRow = 0; indRow < numRows; indRow++)
        {
            this.elementTargetsListBody.deleteRow(-1);
        }

        // Refill the targets table.
        const collection : TargetCollection = this.dataset.getFleet(this.currentFleet);
        const keyField : string = collection.keyField;
        const data : TargetInfoCollection = collection.data;

        const keys : TargetInfoField[] = Object.keys(data);

        for (let indKey = 0; indKey < keys.length; indKey++)
        {
            const key = keys[indKey];
            //const fields : TargetInfoField = data[keys[indKey]];
            const row : HTMLTableRowElement = this.elementTargetsListBody.insertRow();
            row.addEventListener("click", createTargetListClickHandler(key).bind(this));

            const newCell = row.insertCell();
            let newText = document.createTextNode(key.toString());
            newCell.appendChild(newText);
            const newCell2 = row.insertCell();
            let newText2 = document.createTextNode(data[key]["OBJECT_NAME"].toString());
            newCell2.appendChild(newText2);
        }

        this.elementDialog.dispatchEvent(this.eventUpdateDataset);
        this.updateCount();
    }

    /**
     * Update target count label.
     */
    updateCount()
    {
        this.elementFleetNumLabel.innerText = this.dataset.getFleet(this.currentFleet).getLength() + " targets";
    }

    targetsDelete()
    {
        console.log("targetsDelete ");
    }

    targetsMove()
    {
        console.log("targetsMove");
    }

    targetsEdit()
    {
        console.log("targetsEdit");
    }

    fleetClear()
    {
        const fleetData : TargetCollection = this.dataset.getFleet(this.currentFleet);
        fleetData.clear();
        this.update();
    }

    /**
     * Handler for fleet selection from the select element.
     */
    fleetSelect()
    {
        const elem : HTMLOptionElement | null = this.elementFleetSelect.item(this.elementFleetSelect.selectedIndex);
        console.log("fleetSelect " + this.elementFleetSelect.selectedIndex);

        if (elem === null)
        {
            // This should not be reached.
        }
        else 
        {
            console.log(elem.innerText);
            this.currentFleet = elem.innerText;
            this.update();
        }
    }

    /**
     * Add fleet to the dataset.
     */
    fleetAdd()
    {
        const fleetName : string | null = window.prompt("Insert fleet name", "");

        if (fleetName === null)
        {
            // Cancel pressed.
        }
        else if (fleetName.length == 0)
        {
            alert("Empty fleet name is not valid!");
        }
        else if (this.dataset.hasFleet(fleetName))
        {
            alert("Fleet \"" + fleetName + "\" already exists!");
        }
        else 
        {
            this.dataset.addFleet(fleetName);
            const optElement : HTMLOptionElement = new Option(fleetName, fleetName);
            this.elementFleetSelect.add(optElement);
        }
    }

    /**
     * Remove current fleet.
     */
    fleetRemove()
    {
        console.log("fleetRemove " + this.currentFleet);
        console.log(this.elementFleetSelect.options);

        if (this.currentFleet === "default")
        {
            alert("Cannot remove default fleet!");
        }
        else
        {
            if (!this.dataset.removeFleet(this.currentFleet))
            {
                alert("Failed to remove fleet \"" + this.currentFleet + "\"");
            }

            const options : HTMLOptionsCollection = this.elementFleetSelect.options;
            for (let indOption = 0; indOption < options.length; indOption++)
            {
                if (options[indOption].text === "default")
                {
                    options[indOption].selected = true;
                    this.fleetSelect();
                }
            }
        }
    }

    addDataTle()
    {
        console.log("addDateTle");
        this.elementTleContainer.style.visibility = "visible";
    }

    addDataJson()
    {
        console.log("addDateJson");
    }

    addDataOsv()
    {
        console.log("addDateOsv");
    }

    addDataKepler()
    {
        console.log("addDateKepler");
    }
}