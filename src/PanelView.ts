import { IVisibility } from "./IVisibility";
import { Panel, PanelElement } from "./Panel";

/**
 * Class implementing the panel view.
 */
export class PanelView
{
    // 
    private panel : Panel;
    // DOM parent element for the panel.
    elementParent : HTMLElement;
    // DOM elements for the individual elements.
    elements : HTMLElement[];

    /**
     * Public constructor.
     * 
     * @param {Panel} panel 
     *      The panel.
     * @param {string} elementParentId
     */
    constructor(panel : Panel, elementParentId : string)
    {
        this.panel = panel;
        this.elementParent = <HTMLElement> document.getElementById(elementParentId);
        this.elements = [];
    }

    /**
     * Create contents for the panel.
     */
    create() : void
    {
        for (let indElem = 0; indElem < this.panel.getNumElements(); indElem++)
        {
            const htmlElement = document.createElement("img");
            this.elements.push(htmlElement);
            this.elementParent.appendChild(htmlElement);
        }

        this.update();
    }

    /**
     * Update the DOM elements of the panel with the current selection status.
     */
    update() : void 
    {
        for (let indElem = 0; indElem < this.panel.getNumElements(); indElem++)
        {
            const element : PanelElement = <PanelElement> this.panel.getElement(indElem);
            const htmlElement = this.elements[indElem];

            if (this.panel.getActive() == indElem)
            {
                htmlElement.setAttribute("src", element.imagePathLight);
            }
            else 
            {
                htmlElement.setAttribute("src", element.imagePathDark);
            }
        }
    }
}