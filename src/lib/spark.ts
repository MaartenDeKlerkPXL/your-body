/** Geometry shared by the chapter mini charts (drawn at build time, animated at runtime). */
export const SPARK_W = 240;
export const SPARK_H = 44;
/** Minutes of context shown either side of a phase. */
export const SPARK_CONTEXT = 90;

/** Vertical position for a relative value (0–1), in viewBox units. */
export const sparkY = (v: number) => SPARK_H - 4 - v * (SPARK_H - 10);
