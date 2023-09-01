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

        const osvEfi = this.computeSunEfi(timeStamp, nutData);

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

        this.planetShader.draw(osvEfi, this.projection.projectionType);
        this.mapShader.draw(this.projection.projectionType);

        if (this.configuration.getBoolean("showOrbits")) {
            this.drawOrbit(timeStamp);
        }

        const targetNames : string[] = Object.keys(propData);
        for (let indTarget = 0; indTarget < targetNames.length; indTarget++)
        {
            const targetName : string = targetNames[indTarget];
            const targetInfo : TargetInfo = <TargetInfo> this.dataset.getTarget(targetName);

            const osvEfi : OsvFrame = propData[targetName];
            const pos : EarthPosition = Wgs84.coordEfiWgs84(osvEfi.position, 10, 1e-10, false);

            // Draw target location.
            const rEqu = [pos.lon, pos.lat];
            //const rTarget = this.projection.coordEquirectangularTarget(rEqu);
            //const rCanvas = this.projection.coordNormCanvas(rTarget);
            const rCanvas = this.projection.coordEquirectangularCanvas(rEqu);

            this.context2d.beginPath();
            this.context2d.arc(rCanvas[0], rCanvas[1], 4, 0, Math.PI * 2);
            this.context2d.fillStyle = "#ffff00";
            this.context2d.fill();

            if (this.configuration.getBoolean("showLabels")) {
                    this.context2d.fillStyle = "rgba(255, 255, 255)";

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
     * Try drawing the orbit of the current selection.
     * 
     * @param {TimeStamp} timeStamp 
     *      Timestamp.
     */
    drawOrbit(timeStamp : TimeStamp) : void {
        //console.log(this.selection.getSelection());
        this.selection.refresh();
        const selectionList : string[] = this.selection.getSelection();

        if (selectionList.length == 0) {
            return;
        }

        for (let indSelection = 0; indSelection < selectionList.length; indSelection++)
        {
            const targetName : string = selectionList[indSelection];
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