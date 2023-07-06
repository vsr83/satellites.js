import { IVisibility } from "./IVisibility";

export interface PanelElement {
    label : string;
    imagePathLight : string;
    imagePathDark : string;
    visibility : IVisibility;
};

/**
 * Class implementing the panel functionality.
 */
export class Panel
{
    // Array of elements.
    private elements : PanelElement[];

    // Active element index. -1 if no element is active.
    private activeElement : number;

    /**
     * Public constructor.
     */
    constructor()
    {
        this.elements = [];
        this.activeElement = -1;
    }

    /**
     * Add panel element.
     * 
     * @param {string} label 
     *      Label of the panel element.
     * @param {IVisibility} visibility 
     *      Implementation of the IVisibility interface used for show/hide 
     *      operations.
     * @param {string} imagePathDark
     *      Path to the inactive panel image. 
     * @param {string} imagePathLight 
     *      Path to the active panel image.
     */
    addElement(label : string, 
        visibility : IVisibility, 
        imagePathDark : string, 
        imagePathLight : string)
    {
        const element : PanelElement = 
        {
            label : label,
            visibility : visibility,
            imagePathLight : imagePathLight,
            imagePathDark : imagePathDark
        };
        this.elements.push(element);
    }

    /**
     * Get element index.
     * 
     * @param {string} label
     *      Element label. 
     * @returns {number} The element index.
     */
    getElementIndex(label : string) : number 
    {
        for (let indElem = 0; indElem < this.elements.length; indElem++)
        {
            const element = this.elements[indElem];
            if (element.label === label)
            {
                return indElem;
            }
        }
        return -1;
    }

    /**
     * Show element.
     * 
     * @param {string} label
     *      Element label. 
     */
    showElement(label : string) : void
    {
        const indElem = this.getElementIndex(label);

        if (indElem != -1 && this.activeElement != indElem)
        {
            if (this.activeElement != -1)
            {
                this.elements[this.activeElement].visibility.hide();
            }

            const element = this.elements[indElem];
            element.visibility.show();
            this.activeElement = indElem;
        }
    }

    /**
     * Get panel element.
     * 
     * @param {number} index 
     *      Index of the element.
     * @returns {PanelElement | undefined} The element or undefined depending
     * whether the element exists.
     */
    getElement(index : number) : PanelElement | undefined
    {
        if (index < 0 || index >= this.getNumElements())
        {
            return undefined;
        }
        return this.elements[index];
    }
    
    /**
     * Get the number of elements in the panel.
     * 
     * @returns {number} The number of elements.
     */
    getNumElements() : number
    {
        return this.elements.length;
    }

    /**
     * Get the index of the active element.
     * 
     * @returns {numbebr} Index of the active element.
     */
    getActive() : number 
    {
        return this.activeElement;
    }
}