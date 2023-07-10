import { GregorianTime, JulianTime } from "./computation/JulianTime";
import { Time } from "./Time";

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
    setElements(elementTimeLabel : string, 
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

        const instance = this;
        this.elementMinusDay.addEventListener("click", function() {
            instance.time.addToDelta(-1.0); instance.update();
        });
        this.elementMinusHour.addEventListener("click", function() {
            instance.time.addToDelta(-1.0/24.0); instance.update();
        });
        this.elementMinusMin.addEventListener("click", function() {
            instance.time.addToDelta(-1.0/1440.0); instance.update();
        });
        this.elementMinusSec.addEventListener("click", function() {
            instance.time.addToDelta(-1.0/86400.0); instance.update();
        });
        this.elementPlusDay.addEventListener("click", function() {
            instance.time.addToDelta(1.0); instance.update();
        });
        this.elementPlusHour.addEventListener("click", function() {
            instance.time.addToDelta(1.0/24.0); instance.update();
        });
        this.elementPlusMin.addEventListener("click", function() {
            instance.time.addToDelta(1.0/1440.0); instance.update();
        });
        this.elementPlusSec.addEventListener("click", function() {
            instance.time.addToDelta(1.0/86400.0); instance.update();
        });
        this.elementReset.addEventListener("click", function() {
            instance.time.reset(); instance.update();
        });
        this.elementPause.addEventListener("click", function() {
            instance.time.setPause(!instance.time.isPaused());
        });
        this.elementSet.addEventListener("click", function() {
            instance.setTime();
        });
    }

    static createTimeStamp(JT : number) : string
    {
        const timeGreg : GregorianTime = JulianTime.timeGregorian(JT);

        function toFixed(num : number)
        {
            if (num < 10)
            {
                return "0" + num.toString();
            }
            else 
            {
                return num.toString();
            }
        }
        //2023-07-10T00:00:00
        const timeStr = timeGreg.year 
        + "-" + toFixed(timeGreg.month) 
        + "-" + toFixed(timeGreg.mday)
        + "T" + toFixed(timeGreg.hour)
        + ":" + toFixed(timeGreg.minute)
        + ":" + toFixed(Math.floor(timeGreg.second));

        return timeStr;
    }

    /**
     * Update the view.
     */
    update() : number
    {
        const JT = this.time.compute(1.0);

        const timeStr : string = TimeView.createTimeStamp(JT).replace('T', ' ') + " (UTC)";
        this.elementTimeLabel.innerText = timeStr;

        return JT;
    }

    /**
     * Create dialog for setting of time.
     */
    setTime()
    {
        const JT = this.time.compute(1.0);
        const timeIn : string | null = prompt("Select date and time:", TimeView.createTimeStamp(JT) + "Z");
        if (timeIn === null)
        {

        }
        else
        {
            const JTin = JulianTime.timeJulianTs(new Date(timeIn));
            this.time.setTime(JTin);
        }
    }
}