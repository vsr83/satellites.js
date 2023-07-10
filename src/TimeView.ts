import { Time } from "./computation/Time";

/**
 * Class implementing the internals of the time panel.
 */
export class TimeView 
{
    // HTML Elements for the buttons.
    elementTimeLabel : HTMLLabelElement;
    elementMinusDay  : HTMLElement;
    elementMinusHour : HTMLElement;
    elementMinusMin  : HTMLElement;
    elementMinusSec  : HTMLElement;
    elementPlusDay   : HTMLElement;
    elementPlusHour  : HTMLElement;
    elementPlusMin   : HTMLElement;
    elementPlusSec   : HTMLElement;
    elementReset     : HTMLElement;
    elementSet       : HTMLElement;
    elementPause     : HTMLElement;

    time : Time;

    /**
     * Public constructor.
     * 
     * @param {Time} time 
     *      The time object.
     */
    constructor(time : Time)
    {
        this.time = time;
    }

    /**
     * Set HTML DOM elements for the panel.
     * 
     * @param elementTimeLabel 
     * @param elementMinusDay 
     * @param elementMinusHour 
     * @param elementMinusMin 
     * @param elementMinusSec 
     * @param elementPlusDay 
     * @param elementPlusHour 
     * @param elementPlusMin 
     * @param elementPlusSec 
     * @param elementReset 
     * @param elementSet 
     * @param elementPause 
     */
    setTleElements(elementTimeLabel : string, 
        elementMinusDay  : string,
        elementMinusHour : string,
        elementMinusMin  : string,
        elementMinusSec  : string,
        elementPlusDay   : string,
        elementPlusHour  : string,
        elementPlusMin   : string,
        elementPlusSec   : string,
        elementReset     : string,
        elementSet       : string,
        elementPause     : string
        )
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
            this.elementTimeLabel = <HTMLLabelElement> getElement(elementTimeLabel);
            this.elementMinusDay  = getElement(elementMinusDay);
            this.elementMinusHour = getElement(elementMinusHour);
            this.elementMinusMin  = getElement(elementMinusMin);
            this.elementMinusSec  = getElement(elementMinusSec);
            this.elementPlusDay   = getElement(elementPlusDay);
            this.elementPlusHour  = getElement(elementPlusHour);
            this.elementPlusMin   = getElement(elementPlusMin);
            this.elementPlusSec   = getElement(elementPlusSec);
            this.elementReset     = getElement(elementReset);
            this.elementSet       = getElement(elementSet);
            this.elementPause     = getElement(elementPause);
        }
        catch (e : any)
        {
            throw e;
        }
    }
}