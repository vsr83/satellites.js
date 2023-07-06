import { IVisibility } from "./IVisibility";
import { Panel, PanelElement } from "./Panel";

/**
 * Class implementing the panel view.
 */
export class PanelView
{
    // 
    private panel : Panel;
    // Element id for the panel.
    elementParentId : string;
    // DOM parent element for the panel.
    elementParent : HTMLElement;
    // DOM elements for the individual elements.
    elements : HTMLElement[];
    // Icon size in pixels.
    iconSize : number;

    /**
     * Public constructor.
     * 
     * @param {Panel} panel 
     *      The panel.
     * @param {string} elementParentId
     * @param {number} iconSize
     *      Width and height of the icon in pixels.
     */
    constructor(panel : Panel, elementParentId : string, iconSize : number)
    {
        this.panel = panel;
        this.elementParent = <HTMLElement> document.getElementById(elementParentId);
        this.elements = [];
        this.elementParentId = elementParentId;
        this.iconSize = iconSize;
    }

    /**
     * Create contents for the panel.
     */
    create() : void
    {
        console.log("PanelView.create");
        for (let indElem = 0; indElem < this.panel.getNumElements(); indElem++)
        {
            const element : PanelElement = <PanelElement> this.panel.getElement(indElem);
            const htmlElementDiv : HTMLElement = document.createElement("Div");
            const htmlElement : HTMLElement = document.createElement("img");
            htmlElement.setAttribute("id", this.elementParentId + "_" + indElem);
            htmlElementDiv.className = "panelHighlight";
            //htmlElement.setAttribute("style", "width : " + this.iconSize + "px");
            htmlElement.style.width = this.iconSize + "px";
            htmlElement.style.height = this.iconSize + "px";
            this.elements.push(htmlElement);
            this.elementParent.appendChild(htmlElementDiv);
            htmlElementDiv.appendChild(htmlElement);

            const ref = this;
            htmlElement.addEventListener("click", function()
            {
                ref.panel.showElement(element.label);
                ref.update();
            });
        }

        this.update();
    }

    /**
     * Update the DOM elements of the panel with the current selection status.
     */
    update() : void 
    {
        console.log("PanelView.update");
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