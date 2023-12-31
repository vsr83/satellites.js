import { IVisibility } from "../IVisibility";
import { MathUtils } from "../computation/MathUtils";
import { JulianTime } from "../computation/JulianTime";
import { TimeCorrelation, TimeStamp, TimeConvention } from "../computation/TimeCorrelation";
import { Vsop87A } from "../computation/Vsop87A";
import { Frame, Frames, OsvFrame} from "../computation/Frames";
import { Nutation, NutationData } from "../computation/Nutation";
import { TimeView } from "../TimeView";
import { Dataset } from "../viewTargets/Dataset";
import { PropagatedOsvData, Propagation } from "../Propagation";
import { EarthPosition, Wgs84 } from "../computation/Wgs84";
import { PlanetShader2d } from "./PlanetShader2d";
import { MapShader2d } from "./MapShader2d";
import { TargetInfo } from "../viewTargets/Target";
import { Projection, ProjectionType } from "./Projections";
import { Configuration } from "../configuration/Configuration";
import { Selection } from "../Selection";

/**
 * Class implementing the 2d view.
 */
export class View2d implements IVisibility
{
    // Time view providing current time.
    private timeView : TimeView;

    // The dataset being visualized.
    private dataset : Dataset;

    // Propagation tools.
    private propagation : Propagation;

    // Projection tools.
    private projection : Projection;

    // HTML element for 2d canvas.
    private canvas2d : HTMLCanvasElement;
    // HTML element for the WebGL2 canvas.
    private canvasGl : HTMLCanvasElement;
    // HTML element for the container.
    private container : HTMLElement;

    // Time correlation data object for conversions between time conventions.
    private timeCorr : TimeCorrelation;

    // Shader for the planet textures with day and night visualization.
    planetShader : PlanetShader2d;

    // Shared for the Earth map as lines.
    mapShader : MapShader2d;

    // HTML 2d canvas rendering context.
    context2d : CanvasRenderingContext2D;
    // WebGL2 rendering context.
    contextGl : WebGL2RenderingContext;

    // Configuration.
    configuration : Configuration;

    // Selection.
    selection : Selection;

    /**
     * Public constructor.
     * 
     * @param {Propagation} propagation
     *      Propagation.
     * @param {TimeView} timeView
     *      Time view.
     * @param {Configuration} configuration
     *      Configuration
     * @param {Selection} selection
     *      The selection.
     */
    constructor(dataset : Dataset, 
        propagation : Propagation, 
        timeView : TimeView,
        configuration : Configuration,
        selection : Selection)
    {
        this.timeCorr = new TimeCorrelation();
        this.timeView = timeView;
        this.dataset = dataset;
        this.propagation = propagation;
        this.configuration = configuration;
        this.planetShader = new PlanetShader2d();
        this.mapShader = new MapShader2d();
        this.selection = selection;
    }

    /**
     * Set view DOM elements.
     * 
     * @param {HTMLElement} container 
     *      HTML element for the contained element.
     * @param {string} canvas2d 
     *      HTML element for the 2d canvas.
     * @param {string} canvasGl 
     *      HTML element for the WebGL canvas.
     */
    setElements(
        container : string,
        canvas2d : string,
        canvasGl : string)
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
            this.container = <HTMLElement> getElement(container);
            this.canvas2d = <HTMLCanvasElement> getElement(canvas2d);
            this.canvasGl = <HTMLCanvasElement> getElement(canvasGl);
            this.projection = new Projection(this.canvas2d);
        }
        catch (E : any)
        {
            throw E;
        }

        this.context2d = <CanvasRenderingContext2D> this.canvas2d.getContext("2d");
        this.contextGl = <WebGL2RenderingContext> this.canvasGl.getContext("webgl2");
    }

    /**
     * Initialize shaders, buffers and textures.
     * 
     * @param {string} srcTextureDay
     *      URL of the texture for the iluminated part of the sphere. 
     * @param {string} srcTextureNight 
     *      URL of the texture for the non-iluminated part of the sphere.
     * @param {string} urlMapJson
     *      URL to the map JSON.
     */
    init(pathTextureDay : string, pathTextureNight : string, urlMapJson : string) : void
    {
        this.planetShader.init(this.contextGl, pathTextureDay, pathTextureNight);
        this.mapShader.init(this.contextGl, urlMapJson);
    }

    /**
     * Draw the visualization.
     */
    draw()
    {
        const JT = this.timeView.update();

        if (this.isVisible())
        {
            requestAnimationFrame(this.draw.bind(this));
        }

        const timeStamp : TimeStamp = this.timeCorr.computeTimeStamp(JT, TimeConvention.TIME_UTC, true);
        const nutData : NutationData = Nutation.iau1980(timeStamp);

        const osvEfiSun = this.computeSunEfi(timeStamp, nutData);

        const propData : PropagatedOsvData = this.propagation.propagateAll(JT, undefined);
        //console.log(osvEfi);

        const gl = this.contextGl;
        //gl.useProgram(this.programPlanet);

        // Maximize the canvas.
        this.canvasGl.width = window.innerWidth; 
        this.canvasGl.height = window.innerHeight;
        this.canvas2d.width = window.innerWidth;
        this.canvas2d.height = window.innerHeight;

        switch (this.configuration.getString("projection2d")) {
            case "Rectangular":
                this.projection.projectionType = ProjectionType.EQUIRECTANGULAR;
                break;
            case "Azi-Equidistant":
                this.projection.projectionType = ProjectionType.AZI_EQDIST;
                break;
        }

        let osvEfiSat : OsvFrame | null = null;
        
        if (this.selection.getSelection().length > 0 && this.configuration.getBoolean("showVisibility")) {
            osvEfiSat = propData[this.selection.getSelection()[0]];
        }
        
        this.planetShader.draw(osvEfiSun, osvEfiSat, this.projection.projectionType);
        this.mapShader.draw(this.projection.projectionType);

        if (this.configuration.getBoolean("showOrbits")) {
            this.drawOrbit(timeStamp);
        }

        if (this.configuration.getBoolean("showLinesLatitude")) {
            this.drawLinesLatitude();
        }

        if (this.configuration.getBoolean("showLinesLongitude")) {
            this.drawLinesLongitude();            
        }

        if (this.configuration.getBoolean("showEquator")) {
            this.drawEquator();
        }

        if (this.configuration.getBoolean("showPrimeMeridian")) {
            this.drawPrimeMeridian();
        }

        if (this.configuration.getBoolean("showSun")) {
            this.drawSun(osvEfiSun);
        }

        this.drawTargets(propData);
    }

    /**
     * Draw targets.
     * 
     * @param {PropagatedOsvData} propData 
     *      Propagated OSV data for targets.
     */
    drawTargets(propData : PropagatedOsvData) : void {
        const targetNames : string[] = Object.keys(propData);
        for (let indTarget = 0; indTarget < targetNames.length; indTarget++)
        {
            const targetName : string = targetNames[indTarget];
            const targetInfo : TargetInfo = <TargetInfo> this.dataset.getTarget(targetName);

            const osvEfi : OsvFrame = propData[targetName];
            const pos : EarthPosition = Wgs84.coordEfiWgs84(osvEfi.position, 10, 1e-10, false);

            const selectionList : string[] = this.selection.getSelection();
            const selected = selectionList.includes(targetName);

            // Draw target location.
            const rEqu = [pos.lon, pos.lat];
            //const rTarget = this.projection.coordEquirectangularTarget(rEqu);
            //const rCanvas = this.projection.coordNormCanvas(rTarget);
            const rCanvas = this.projection.coordEquirectangularCanvas(rEqu);

            this.context2d.beginPath();
            this.context2d.arc(rCanvas[0], rCanvas[1], 2, 0, Math.PI * 2);

            if (selected) {
                this.context2d.fillStyle = "#ffff00";
            } else {
                this.context2d.fillStyle = "#ffffff";
            }
            this.context2d.fill();

            if (this.configuration.getBoolean("showLabels") || selected) {
                //this.context2d.fillStyle = "rgba(255, 255, 255)";

                this.context2d.textAlign = "center";
                this.context2d.textBaseline = "bottom";
                this.context2d.textAlign = "right";
                this.context2d.strokeStyle = this.context2d.fillStyle;

                const caption : string = (<string> targetInfo.OBJECT_NAME).trim() + " ";
                this.context2d.fillText(caption, rCanvas[0], rCanvas[1]); 
            }
        }
    }

    /**
     * Draw the Equator line.
     */
    drawEquator() : void {
        this.context2d.beginPath();
        this.context2d.strokeStyle = "#cccccc";

        if (this.configuration.getString("projection2d") == "Rectangular") {
                const rCanvasStart = this.projection.coordEquirectangularCanvas([-180, 0]);
                const rCanvasEnd = this.projection.coordEquirectangularCanvas([180, 0]);
                this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
                this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);
        } else {
            const lonStep : number = 1.0;
            for (let lonDeg = -180; lonDeg <= 180.0; lonDeg += 1.0) {
                const rCanvasStart = this.projection.coordEquirectangularCanvas([lonDeg, 0]);
                const rCanvasEnd = this.projection.coordEquirectangularCanvas([lonDeg + lonStep, 0]);
                this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
                this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);
            }
        }

        this.context2d.stroke();
    }

    /**
     * Draw the Prime Meridian.
     */
    drawPrimeMeridian() : void {
        this.context2d.beginPath();
        this.context2d.strokeStyle = "#cccccc";

        const rCanvasStart = this.projection.coordEquirectangularCanvas([0, 90]);
        const rCanvasEnd = this.projection.coordEquirectangularCanvas([0, -90]);
        this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
        this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);

        this.context2d.stroke();
    }

    /**
     * Draw latitude lines.
     */
    drawLinesLatitude() : void {
        const latStep : number = this.configuration.getNumber("gridLatitudeStep");
        this.context2d.beginPath();
        this.context2d.strokeStyle = "#999999";

        if (this.configuration.getString("projection2d") == "Rectangular") {
            for (let latDeg = 0; latDeg <= 90.0; latDeg += latStep) {
                const rCanvasStart = this.projection.coordEquirectangularCanvas([-180, latDeg]);
                const rCanvasEnd = this.projection.coordEquirectangularCanvas([180, latDeg]);
                this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
                this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);

                const rCanvasStart2 = this.projection.coordEquirectangularCanvas([-180, -latDeg]);
                const rCanvasEnd2 = this.projection.coordEquirectangularCanvas([180, -latDeg]);
                this.context2d.moveTo(rCanvasStart2[0], rCanvasStart2[1]);
                this.context2d.lineTo(rCanvasEnd2[0], rCanvasEnd2[1]);
            }
        } else {
            const lonStep : number = 1.0;
            for (let latDeg = 0; latDeg <= 90.0; latDeg += latStep) {
                for (let lonDeg = -180; lonDeg <= 180.0; lonDeg += 1.0) {
                    const rCanvasStart = this.projection.coordEquirectangularCanvas([lonDeg, latDeg]);
                    const rCanvasEnd = this.projection.coordEquirectangularCanvas([lonDeg + lonStep, latDeg]);
                    this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
                    this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);

                    const rCanvasStart2 = this.projection.coordEquirectangularCanvas([lonDeg, -latDeg]);
                    const rCanvasEnd2 = this.projection.coordEquirectangularCanvas([lonDeg + lonStep, -latDeg]);
                    this.context2d.moveTo(rCanvasStart2[0], rCanvasStart2[1]);
                    this.context2d.lineTo(rCanvasEnd2[0], rCanvasEnd2[1]);
                }
            }
        }

        this.context2d.stroke();
    }

    /**
     * Draw longitude lines.
     */
    drawLinesLongitude() : void {
        const lonStep : number = this.configuration.getNumber("gridLongitudeStep");
        this.context2d.beginPath();
        this.context2d.strokeStyle = "#999999";

        for (let lonDeg = 0; lonDeg <= 180.0; lonDeg += lonStep) {
            const rCanvasStart = this.projection.coordEquirectangularCanvas([lonDeg, -90]);
            const rCanvasEnd = this.projection.coordEquirectangularCanvas([lonDeg, 90]);
            this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
            this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);

            const rCanvasStart2 = this.projection.coordEquirectangularCanvas([-lonDeg, -90]);
            const rCanvasEnd2 = this.projection.coordEquirectangularCanvas([-lonDeg, 90]);
            this.context2d.moveTo(rCanvasStart2[0], rCanvasStart2[1]);
            this.context2d.lineTo(rCanvasEnd2[0], rCanvasEnd2[1]);
        }

        this.context2d.stroke();
    }

    /**
     * Try drawing the orbit of the current selection.
     * 
     * @param {TimeStamp} timeStamp 
     *      Timestamp.
     */
    drawOrbit(timeStamp : TimeStamp) : void {
        //console.log(this.selection.getSelection());
        this.selection.refresh();

        let targetList : string[] = [];

        if (this.configuration.getString("showAllOrbits") == "All") {
            targetList = this.dataset.targetNames();            
        } else {
            targetList = this.selection.getSelection();
        }
        if (targetList.length == 0) {
            return;
        }

        for (let indSelection = 0; indSelection < targetList.length; indSelection++)
        {
            const targetName : string = targetList[indSelection];
            const period = this.propagation.getOrbitalPeriod(targetName);

            const orbitData : EarthPosition[] = this.propagation.propagateOneRange(targetName, 
                timeStamp.JTut1 - period * this.configuration.getNumber("orbitsBackward"),
                timeStamp.JTut1 + period * this.configuration.getNumber("orbitsForward"), 
                0.1/1440.0, undefined);

            let prev : number[] = [0.0, 0.0];
            for (let indData = 0; indData < orbitData.length - 1; indData++) {
                const posStart : EarthPosition = orbitData[indData];
                const posEnd : EarthPosition = orbitData[indData + 1];

                const rCanvasStart = this.projection.coordEquirectangularCanvas([posStart.lon, posStart.lat]);
                const rCanvasEnd = this.projection.coordEquirectangularCanvas([posEnd.lon, posEnd.lat]);

                if (Math.sqrt(Math.pow(rCanvasStart[0] - rCanvasEnd[0], 2) + 
                            Math.pow(rCanvasStart[1] - rCanvasEnd[1], 2)) < 100.0) {
                    this.context2d.moveTo(rCanvasStart[0], rCanvasStart[1]);
                    this.context2d.lineTo(rCanvasEnd[0], rCanvasEnd[1]);
                }
                prev = rCanvasEnd;
            }
            this.context2d.strokeStyle = "#999999";
            this.context2d.stroke();
        }
    }

    /**
     * Draw position of the Sun.
     * 
     * @param {OsvFrame} osvEfiSun 
     *      Position of the Sun in the EFI frame.
     */
    drawSun(osvEfiSun : OsvFrame) : void {
        const earthPos : EarthPosition = Wgs84.coordEfiWgs84(osvEfiSun.position, 5, 1e-10, false);
        const rCanvas = this.projection.coordEquirectangularCanvas([earthPos.lon, earthPos.lat]);
        // Draw Sun location.
        this.context2d.beginPath();
        this.context2d.arc(rCanvas[0], rCanvas[1], 10, 0, Math.PI * 2);
        this.context2d.fillStyle = "#ffff00";
        this.context2d.fill();        
    }

    /**
     * Compute OSV for the Sun in the EFI frame.
     * 
     * @param {TimeStamp} timeStamp 
     *      Timestamp used for the computation.
     * @param {NutationData} nutData 
     *      Nutation data.
     * @returns {OsvFrame} Orbit state vector.
     */
    computeSunEfi(timeStamp : TimeStamp, nutData : NutationData) : OsvFrame
    {
        const osvHelEarth : OsvFrame = Vsop87A.planetHeliocentric("earth", timeStamp);
        const osvEclHel : OsvFrame = {frame : Frame.FRAME_ECLHEL, timeStamp : timeStamp, 
        position : [0, 0, 0], velocity : [0, 0, 0]};
        const osvEclGeo = Frames.coordHelEcl(osvEclHel, osvHelEarth);
        const osvJ2000 = Frames.coordEclEq(osvEclGeo);
        const osvMoD = Frames.coordJ2000Mod(osvJ2000);
        const osvToD = Frames.coordModTod(osvMoD, nutData);
        const osvPef = Frames.coordTodPef(osvToD, nutData);
        const osvEfi = Frames.coordPefEfi(osvPef);

        return osvEfi;
    } 

    /**
     * Show the view.
     */
    show() : void
    {
        this.container.style.visibility = "visible";
        requestAnimationFrame(this.draw.bind(this));
    }

    /**
     * Hide the view.
     */
    hide() : void 
    {
        this.container.style.visibility = "hidden";
    }

    /**
     * Whether the view is visible.
     * 
     * @returns {boolean} Visibility.
     */
    isVisible(): boolean 
    {
        return (this.container.style.visibility === "visible");
    }
}