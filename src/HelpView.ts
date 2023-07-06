import { IVisibility } from "./IVisibility";

/**
 * Class implementing the help dialog. Since there is no interactivity, there
 * is no corresponding "model" class.
 */
export class HelpView implements IVisibility
{
    // HTML element for the help dialog.
    private elementDialog : HTMLElement;
    // Flag indicating whether the dialog is visible.
    private visible : boolean;

    /**
     * Public constructor.
     */
    constructor()
    {
        this.visible = false;
    }

    /**
     * Set the help dialog element.
     * 
     * @param {string} elementId 
     *      The HTML element id for the dialog.
     */
    setElement(elementId : string)
    {
        const elem : HTMLElement | null = document.getElementById(elementId);
        if (elem === null)
        {
            throw Error("Element \"" + elementId + "\" not found!");
        }
        this.elementDialog = elem;
    }

    /**
     * Show the dialog.
     */
    show() : void 
    {
        this.visible = true;
        this.elementDialog.style.visibility = "visible";
    }

    /**
     * Hide the dialog.
     */
    hide() : void 
    {
        this.visible = false;
        this.elementDialog.style.visibility = "hidden";
    }

    /**
     * Is the dialog visible.
     * 
     * @returns {boolean} Whether the dialog is visible.
     */
    isVisible() : boolean 
    {
        return this.visible;
    }
}