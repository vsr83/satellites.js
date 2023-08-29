import { Dataset } from "./viewTargets/Dataset";
import { TargetCollection, TargetInfoField, TargetInfo } from "./viewTargets/Target";
import { Sgp4Propagation } from "./TlePropagators";
import { Tle } from "./Tle";
import { TimeConvention, TimeCorrelation, TimeStamp } from "./computation/TimeCorrelation";
import { Frames, OsvFrame } from "./computation/Frames";
import { Nutation, NutationData } from "./computation/Nutation";
import { Wgs84, EarthPosition } from "./computation/Wgs84";

export type PropagationData = {
    [key : string] : Sgp4Propagation
};

export type PropagatedOsvData = {
    [key : string] : OsvFrame
};

/**
 * Class
 */
export class Propagation 
{
    // Dataset.
    private dataset : Dataset;
    // Propagation data.
    propData : PropagationData;
    // Time correlation.
    timeCorrelation : TimeCorrelation;

    /**
     * Public constructor.
     * 
     * @param {Dataset} dataset 
     */
    constructor(dataset : Dataset, timeCorrelation : TimeCorrelation)
    {
        this.dataset = dataset;
        this.timeCorrelation = timeCorrelation;
    }

    /**
     * Initialize propagation data structures with the current dataset. This has to be called
     * whenever new targets are added to the dataset.
     */
    init()
    {
        const fleetNames : string[] = this.dataset.getFleetNames();
        this.propData = {};

        for (let indFleet = 0; indFleet < fleetNames.length; indFleet++)
        {
            const fleetName : string = fleetNames[indFleet];

            const targetCollection : TargetCollection = this.dataset.getFleet(fleetName);
            const keys : TargetInfoField[] = targetCollection.getKeys();

            for (let indKey = 0; indKey < keys.length; indKey++)
            {
                const key : TargetInfoField = keys[indKey];

                const targetInfo : TargetInfo = targetCollection.getTarget(key);

                const tle = Tle.fromJson(targetInfo);
                const sgp4Propagation : Sgp4Propagation = new Sgp4Propagation(tle, this.timeCorrelation);
                sgp4Propagation.initialize();

                this.propData[key] = sgp4Propagation;
            }
        }
    }

    /**
     * Propagate all TLEs in the dataset.
     * 
     * @param {number} JT 
     *      Julian time.
     * @param {NutationData | null} nutation
     *      Nutation data.
     * @returns {PropagatedOsvData} Propagated OSV data.
     */
    propagateOneRange(targetName : string, JTmin : number, JTmax : number, JTstep : number, 
        nutation : NutationData | undefined) 
    : EarthPosition[]
    {
        const timeStampStart : TimeStamp = this.timeCorrelation.computeTimeStamp(JTmin, TimeConvention.TIME_UT1, false);

        if (nutation === undefined) {
            nutation = Nutation.iau1980(timeStampStart);
        }

        const data : EarthPosition[] = [];
        const propagation = this.propData[targetName];

        for (let JT = JTmin; JT <= JTmax; JT += JTstep)
        {
            const tSince : number = (JT - propagation.tle.jtUt1Epoch) * 1440.0;
            const osv : OsvFrame = propagation.compute(tSince);

            const osvMod = Frames.coordJ2000Mod(osv);
            const osvTod = Frames.coordModTod(osvMod, <NutationData> nutation);
            const osvPef = Frames.coordTodPef(osvTod, <NutationData> nutation);
            const osvEfi = Frames.coordPefEfi(osvPef);
            const pos : EarthPosition = Wgs84.coordEfiWgs84(osvEfi.position, 10, 1e-10, false);

            data.push(pos); 
        }

        return data;
    }

    /**
     * Propagate all TLEs in the dataset.
     * 
     * @param {number} JT 
     *      Julian time.
     * @param {NutationData | undefined} nutation
     *      Nutation data.
     * @returns {PropagatedOsvData} Propagated OSV data.
     */
    propagateAll(JT : number, nutation : NutationData | undefined) : PropagatedOsvData
    {
        const targetNames : string[] = Object.keys(this.propData);
        const propagated : PropagatedOsvData = {};

        const timeStamp : TimeStamp = this.timeCorrelation.computeTimeStamp(JT, TimeConvention.TIME_UT1, false);
        
        if (nutation === undefined) {
            nutation = Nutation.iau1980(timeStamp);
        }

        for (let indTarget = 0; indTarget < targetNames.length; indTarget++)
        {
            const targetName : string = targetNames[indTarget];

            const propagation = this.propData[targetName];
            const tSince : number = (JT - propagation.tle.jtUt1Epoch) * 1440.0;
            const osv : OsvFrame = propagation.compute(tSince);

            const osvMod = Frames.coordJ2000Mod(osv);
            const osvTod = Frames.coordModTod(osvMod, <NutationData> nutation);
            const osvPef = Frames.coordTodPef(osvTod, <NutationData> nutation);
            const osvEfi = Frames.coordPefEfi(osvPef);

            propagated[targetName] = osvEfi; 
        }

        return propagated;
    }

    getOrbitalPeriod(targetName : string) : number {
        return 1.0 / this.propData[targetName].tle.meanMotion;
    }

    getPropagationData() : PropagationData {
        return this.propData;
    }
}