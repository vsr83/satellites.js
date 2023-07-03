import { TargetCollection, TargetInfo, TargetInfoCollection, TargetInfoField } from "./Target";
import { Dataset } from "./Dataset";

/**
 * Class implementing the internals of the dataset dialog.
 */
export class DatasetView 
{
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
    private elementTargetsMoveButton   : HTMLElement;
    private elementTargetsEditButton   : HTMLElement;
    private elementTargetsListTable    : HTMLTableElement;
    private elementTargetsListBody     : HTMLTableSectionElement;

    // Target JSON fieldset elements
    private elementDatasetText : HTMLTextAreaElement;

    // The current fleet.
    private currentFleet : string;

    // The dataset the view is representing.
    private dataset : Dataset;

    constructor(dataset : Dataset)
    {
        this.dataset = dataset;
    }

    /**
     * Set HTML element ids for all dialog elements.
     * 
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
    setElements(elementFleetSelect : string,
        elementFleetAddButton      : string,
        elementFleetRemoveButton   : string,
        elementFleetNumLabel       : string,
        elementAddDataTleButton    : string,
        elementAddDataOsvButton    : string,
        elementAddDataKeplerButton : string,
        elementAddDataJsonButton   : string,
        elementTargetsFilter       : string,
        elementTargetsDeleteButton : string,
        elementTargetsMoveButton   : string,
        elementTargetsEditButton   : string,
        elementTargetsListTable    : string)
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
            this.elementTargetsDeleteButton = getElement(elementTargetsDeleteButton);
            this.elementTargetsMoveButton = getElement(elementTargetsMoveButton);
            this.elementTargetsEditButton = getElement(elementTargetsEditButton);
            this.elementTargetsListTable = <HTMLTableElement> getElement(elementTargetsListTable);
        }
        catch (E : any)
        {
            throw E;
        }
        
        this.elementFleetSelect.addEventListener("change", this.fleetSelect.bind(this));
        this.elementFleetAddButton.addEventListener("click", this.fleetAdd.bind(this));
        this.elementFleetRemoveButton.addEventListener("click", this.fleetRemove.bind(this));
        this.elementAddDataTleButton.addEventListener("click", this.addDataTle.bind(this));
        this.elementAddDataJsonButton.addEventListener("click", this.addDataJson.bind(this));
        this.elementAddDataOsvButton.addEventListener("click", this.addDataOsv.bind(this));
        this.elementAddDataKeplerButton.addEventListener("click", this.addDataKepler.bind(this));

        this.elementTargetsDeleteButton.addEventListener("click", this.targetsDelete.bind(this));
        this.elementTargetsMoveButton.addEventListener("click", this.targetsMove.bind(this));
        this.elementTargetsEditButton.addEventListener("click", this.targetsEdit.bind(this));

        this.elementTargetsListBody = this.elementTargetsListTable.createTBody();
        this.fleetSelect();
    }

    update()
    {
        
        const rows = this.elementTargetsListBody.rows;
        
        // rows.length will change value during the loop.
        const numRows = rows.length;

        for (let indRow = 0; indRow < numRows; indRow++)
        {
            this.elementTargetsListBody.deleteRow(-1);
        }

        const collection : TargetCollection = this.dataset.getFleet(this.currentFleet);
        const keyField : string = collection.keyField;
        const data : TargetInfoCollection = collection.data;

        const keys : TargetInfoField[] = Object.keys(data);

        for (let indKey = 0; indKey < keys.length; indKey++)
        {
            const key = keys[indKey];
            //const fields : TargetInfoField = data[keys[indKey]];
            const row : HTMLTableRowElement = this.elementTargetsListBody.insertRow();

            const newCell = row.insertCell();
            let newText = document.createTextNode(key.toString());
            newCell.appendChild(newText);
            const newCell2 = row.insertCell();
            let newText2 = document.createTextNode(data[key]["OBJECT_NAME"].toString());
            newCell2.appendChild(newText2);
        }

        this.elementFleetNumLabel.innerText = keys.length + " targets";
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