import { IVisibility } from "../IVisibility";
import { MathUtils } from "../computation/MathUtils";
import { JulianTime } from "../computation/JulianTime";
import { TimeCorrelation, TimeStamp, TimeConvention } from "../computation/TimeCorrelation";
import { Vsop87A } from "../computation/Vsop87A";
import { Frame, Frames, OsvFrame} from "../computation/Frames";
import { Nutation, NutationData } from "../computation/Nutation";
import { TimeView } from "../TimeView";
import { Dataset } from "../Dataset";
import { PropagatedOsvData, Propagation } from "../Propagation";
import { EarthPosition, Wgs84 } from "../computation/Wgs84";
import { PlanetShader2d } from "./PlanetShader2d";
import { MapShader2d } from "./MapShader2d";

/**
 * Class implementing the 2d view.
 */
export class View2d implements IVisibility
{
    private timeView : TimeView;
    private dataset : Dataset;
    private propagation : Propagation;

    // HTML element for 2d canvas.
    private canvas2d : HTMLCanvasElement;
    // HTML element for the WebGL2 canvas.
    private canvasGl : HTMLCanvasElement;
    // HTML element for the container.
    private container : HTMLElement;

    private timeCorr : TimeCorrelation;

    planetShader : PlanetShader2d;
    mapShader : MapShader2d;

    // HTML 2d canvas rendering context.
    context2d : CanvasRenderingContext2D;
    // WebGL2 rendering context.
    contextGl : WebGL2RenderingContext;

    /**
     * Public constructor.
     * 
     * @param {TimeView} timeView
     *      Time view.
     */
    constructor(dataset : Dataset, 
        propagation : Propagation, 
        timeView : TimeView)
    {
        this.timeCorr = new TimeCorrelation();
        this.timeView = timeView;
        this.dataset = dataset;
        this.propagation = propagation;
        this.planetShader = new PlanetShader2d();
        this.mapShader = new MapShader2d();
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
        function lonToX(lon : number, canvasJs : HTMLCanvasElement) : number
        {
            return canvasJs.width * ((lon + 180.0) / 360.0);
        }
        
        function latToY(lat : number, canvasJs : HTMLCanvasElement) : number
        {
            return canvasJs.height * ((-lat + 90.0) / 180.0);
        }
        
        function xToLon(x : number, canvasJs  : HTMLCanvasElement) : number
        {
            return (360.0 * (x - canvasJs.width / 2)) / canvasJs.width;
        }
        
        function yToLat(y : number, canvasJs : HTMLCanvasElement) : number
        {
            return -(180.0 * (y - canvasJs.height / 2)) / canvasJs.height;
        }

        const JT = this.timeView.update();

        /*if (this.numTextures < 2)
        {
            if (this.isVisible())
            {
                requestAnimationFrame(this.draw.bind(this));
            }
        }*/
        if (this.isVisible())
        {
            requestAnimationFrame(this.draw.bind(this));
        }

        const timeStamp : TimeStamp = this.timeCorr.computeTimeStamp(JT, TimeConvention.TIME_UTC, true);
        const nutData : NutationData = Nutation.iau1980(timeStamp);

        const osvEfi = this.computeSunEfi(timeStamp, nutData);

        const propData : PropagatedOsvData = this.propagation.propagateAll(JT);
        //console.log(osvEfi);

        const gl = this.contextGl;
        //gl.useProgram(this.programPlanet);

        this.canvasGl.width = window.innerWidth; //document.documentElement.clientWidth;
        this.canvasGl.height = window.innerHeight;// document.documentElement.clientHeight;
        this.canvas2d.width = window.innerWidth;//document.documentElement.clientWidth;
        this.canvas2d.height = window.innerHeight;//document.documentElement.clientHeight;
        console.log(this.canvasGl.width + " " + this.canvasGl.height);

        this.planetShader.draw(osvEfi);
        this.mapShader.draw();

        const targetNames : string[] = Object.keys(propData);
        for (let indTarget = 0; indTarget < targetNames.length; indTarget++)
        {
            const targetName : string = targetNames[indTarget];

            const osvEfi : OsvFrame = propData[targetName];
            const pos : EarthPosition = Wgs84.coordEfiWgs84(osvEfi.position, 10, 1e-10, false);

            // Draw Sun location.
            const x = lonToX(pos.lon, this.canvas2d);
            const y = latToY(pos.lat, this.canvas2d);
            this.context2d.beginPath();
            this.context2d.arc(x, y, 2, 0, Math.PI * 2);
            this.context2d.fillStyle = "#ffff00";
            this.context2d.fill();

            this.context2d.fillStyle = "rgba(255, 255, 255)";

            this.context2d.textAlign = "center";
            this.context2d.textBaseline = "bottom";
            this.context2d.textAlign = "right";
            this.context2d.strokeStyle = this.context2d.fillStyle;

            const caption : string = targetName;

            this.context2d.fillText(caption, x, y); 

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