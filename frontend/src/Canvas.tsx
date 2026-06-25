import { useEffect, useRef } from "react";

interface CanvasProps {
    draw: (
        context: CanvasRenderingContext2D,
        displayWidth: number,
        displayHeight: number,
        projCenterX: number,
        projCenterY: number
    ) => void;
    width?: number;
    height?: number;
}

const Canvas = ({ draw, width, height, ...rest }: CanvasProps) => {
    const canvasRef = useCanvas(draw);

    return (
        <canvas
            ref={canvasRef}
            width={width ?? window.innerWidth}
            height={height ?? window.innerHeight}
            {...rest}
        />
    );
};

const useCanvas = (
    draw: (
        context: CanvasRenderingContext2D,
        displayWidth: number,
        displayHeight: number,
        projCenterX: number,
        projCenterY: number
    ) => void
) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        const displayWidth = canvas.width;
        const displayHeight = canvas.height;

        // projection center coordinates sets location of origin
        const projCenterX = displayWidth / 2;
        const projCenterY = displayHeight / 2;

        let animationFrameId: number;

        const render = () => {
            draw(context, displayWidth, displayHeight, projCenterX, projCenterY);
            animationFrameId = window.requestAnimationFrame(render);
        };
        render();

        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [draw]);

    return canvasRef;
};

export default Canvas;
