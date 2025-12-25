declare module 'canvas-confetti' {
    interface ConfettiOptions {
      particleCount?: number;
      angle?: number;
      spread?: number;
      startVelocity?: number;
      decay?: number;
      gravity?: number;
      drift?: number;
      ticks?: number;
      origin?: {
        x?: number;
        y?: number;
      };
      colors?: string[];
      shapes?: string[];
      scalar?: number;
      zIndex?: number;
      disableForReducedMotion?: boolean;
    }
  
    interface Confetti {
      (options?: ConfettiOptions): void;
      reset(): void;
      create(
        canvas: HTMLCanvasElement,
        options?: { resize?: boolean; useWorker?: boolean }
      ): Confetti;
    }
  
    const confetti: Confetti;
    export default confetti;
  }
  