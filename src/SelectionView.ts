import { Dataset } from "./viewTargets/Dataset";
import { Selection } from "./Selection";
import { TargetInfo, TargetCollection, TargetInfoField } from "./viewTargets/Target";

/**
 * Class implementing the selection view.
 */
export class SelectionView 
{
    /**
     * Public constructor.
     * 
     * @param {Selection} selection 
     *      The selection.
     * @param {number} Maximum number of search results shown.
     */
    constructor(selection : Selection, numResults : number)
    {
        this.selection = selection;
        this.numResults = numResults;
    }

    /**
     * Set view elements.
     * 
     * @param {string} searchTextAreaId 
     *      Element id for the search text area.
     * @param {string} searchResultsId 
     *      Element id for the popout box.
     */
    setElements(searchTextAreaId : string,
        searchResultsId : string, 
        selectionClearButtonId : string,
        selectionLabelId : string) 
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

        this.searchTextArea = <HTMLTextAreaElement> getElement(searchTextAreaId);
        this.searchResults = <HTMLElement> getElement(searchResultsId);

        const ulElement : HTMLElement = document.createElement("ul");
        ulElement.setAttribute("id", "searchResultsList");
        this.searchResults.appendChild(ulElement);
        
        const selectionView : SelectionView = this;
        this.searchTextArea.addEventListener("change", function() {
            console.log("change");
        });

        this.searchTextArea.addEventListener("input", function() {
            console.log("input");
            selectionView.updateSearchResults();
        });

        this.resultElements = [];

        for (let indResult = 0; indResult < this.numResults; indResult++)
        {
            const liElement : HTMLElement = document.createElement("li");
            liElement.setAttribute("class", "searchResultsItem");
            ulElement.appendChild(liElement);
            //liElement.innerText = "RESULT " + indResult;

            liElement.addEventListener("click", function() {
                console.log("click " + indResult);

                selectionView.select(selectionView.resultKeys[indResult], 
                    selectionView.resultElements[indResult].innerText);
            });

            this.resultElements.push(liElement);
        }
    }

    updateSearchResults() 
    {
        this.searchResults.style.visibility = "visible";

        const searchValue : string = this.searchTextArea.value.toUpperCase();
        const dataset : Dataset = this.selection.getDataset();
        //const targetNames : string[] = this.selection.getDataset().targetNames();

        const fleetNames : string[] = dataset.getFleetNames();
        this.resultKeys = [];
        let indResult = 0;

        if (searchValue.length > 0)
        {
            for (let indFleet = 0; indFleet < fleetNames.length; indFleet++)
            {
                const fleetName : string = fleetNames[indFleet];
                const targetCollection : TargetCollection = dataset.getFleet(fleetName);
                const keys : TargetInfoField[] = targetCollection.getKeys();

                for (let indTarget = 0; indTarget < keys.length; indTarget++)
                {
                    const key : string = <string> keys[indTarget];
                    const targetInfo : TargetInfo = targetCollection.getTarget(key);

                    const upperCase : string = (key.trim() + " " + targetInfo['OBJECT_NAME']).toUpperCase();

                    if (upperCase.includes(searchValue))
                    {
                        this.resultElements[indResult].innerText = upperCase;
                        this.resultKeys.push(key);

                        indResult++;
                        if (indResult == this.numResults)
                        {
                            break;
                        }
                    }
                }
            }
        }

        if (indResult == 0)
        {
            this.searchResults.style.visibility = "hidden";
        }

        for (; indResult < this.numResults; indResult++)
        {
            this.resultElements[indResult].innerText = "";
        }

        //console.log(targetNames);
        console.log(searchValue);
    }

    select(key : string, label : string)
    {
        console.log("select " + key);

        this.selection.setSelection([key]);
        this.searchResults.style.visibility = "hidden";
        this.searchTextArea.value = label;
    }

    // HTML element for the search text area.
    private searchTextArea : HTMLTextAreaElement;
    // HTML element for the search popout box.
    private searchResults : HTMLElement;
    // The selection used for the view.
    private selection : Selection;
    // Maximum number of search results shown.
    private numResults : number;

    private resultElements : HTMLElement[];
    private resultKeys : string[];
}