import { JulianTime } from "./computation/JulianTime";

export class Time
{
    // Computed Julian time at last action.
    private JTstart : number;
    // Clock Julian time at last action.
    private JTclockStart : number;
    // Computed Julian time at last call.
    private JTprev : number;
    // Delta in Julian time added by the user.
    private JTdelta : number;
    // Warp factor at last call.
    private warpFactorPrev : number;
    // Pause
    private pause : boolean;

    constructor()
    {

    }

    /**
     * Reset time.
     */
    reset() : void
    {
        this.JTstart = JulianTime.dateJulianTs(new Date);
        this.JTclockStart = this.JTstart;
        this.JTprev = this.JTstart;
        this.warpFactorPrev = 1.0;
        this.JTdelta = 0.0;
    }

    /**
     * Compute new state and Julian time.
     * 
     * @param {number} warpFactorNew 
     *      New warp factor.
     * @returns {number} The Julian time.
     */
    compute(warpFactorNew : number) : number
    {
        let dateNow = new Date();
        const JTclock = JulianTime.timeJulianTs(new Date(dateNow.getTime()));
                
        let JT;
        if (this.pause)
        {
            this.JTclockStart = JTclock;
            this.JTstart = this.JTprev;
            JT = this.JTprev;        
        }
        else if (this.warpFactorPrev != warpFactorNew && warpFactorNew != 0)
        {
            this.JTclockStart = JTclock;
            this.JTstart = this.JTprev;
            JT = this.JTprev;
        }
        else
        {
             JT = this.JTstart + (JTclock - this.JTclockStart) * warpFactorNew;
        }
        
        this.JTprev = JT;
        JT += this.JTdelta;
        this.warpFactorPrev = warpFactorNew;        

        return JT;
    }

    /**
     * Set time.
     * 
     * @param {number} JTin 
     *      Julian time.
     */
    setTime(JTin : number) 
    {
        let dateNow = new Date();
        this.JTclockStart = JulianTime.timeJulianTs(new Date(dateNow.getTime()));
        this.JTstart = JTin;
        this.JTprev = JTin;
        this.JTdelta = 0.0;
    }

    /**
     * Set pause.
     * 
     * @param {boolean} pause 
     *      Whether pause is enabled.
     */
    setPause(pause : boolean)
    {
        this.pause = pause;
    }

    /**
     * Check whether pause is enabled.
     * 
     * @return {boolean} Whether pause is enabled.
     */
    isPaused() : boolean
    {
        return this.pause;
    }

    /**
     * Add to delta-time.
     * 
     * @param {number} JTdelta 
     *      The delta-time in Julian days.
     */
    addToDelta(JTdelta : number)
    {
        this.JTdelta += JTdelta;
    }
}