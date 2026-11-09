import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { portrait } from "@/content/portrait";
import type { Locale } from "@/i18n/routing";

type Variant = "base" | "alternate";

/**
 * One layer of "Specimen 01" (Homepage R02). Fills its container.
 * - base: warm paper tones, the real photograph once `portrait.base.src` exists.
 * - alternate: the machine reading — dark, scan-lined silhouette.
 * Blueprint labels (specimen, meta, src, the big "01") are part of the art direction.
 */
export async function Portrait({ variant, numeral = true }: { variant: Variant; numeral?: boolean }) {
  const t = await getTranslations("portrait");
  const locale = (await getLocale()) as Locale;
  const image = portrait[variant];
  // Light marks when the layer is dark: the alternate, or any real photo (both are dark).
  const dark = variant === "alternate" || Boolean(image.src);
  const ink = dark ? "text-paper-300" : "text-[#3f3d39]";
  // The reading point sits on the face: the eye line of the photos, or the placeholder's head.
  const y = image.src ? "top-[22%]" : "top-[31%]";
  const yLabel = image.src ? "top-[calc(22%+8px)]" : "top-[calc(31%+8px)]";

  return (
    <div className={`absolute inset-0 overflow-hidden ${image.src ? "bg-[#1f1f1f]" : dark ? "bg-ink-800" : "bg-[#d3cfc5]"}`}>
      {image.src ? (
        <Image
          src={image.src}
          alt={image.alt[locale]}
          width={image.width}
          height={image.height}
          sizes="(min-width: 768px) 58vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover object-[50%_20%]"
        />
      ) : (
        <div role="img" aria-label={t("placeholder")} className="absolute inset-0">
          <Silhouette dark={dark} />
        </div>
      )}

      <div aria-hidden="true" className={`pointer-events-none absolute inset-0 font-mono text-[11px] tracking-[0.04em] uppercase ${ink}`}>
        {/* Crosshair at the reading point */}
        <span className={`absolute ${y} left-1/2 -ml-[22px] h-px w-11 ${dark ? "bg-paper-300" : "bg-[#3f3d39]"}`} />
        <span className={`absolute ${y} left-1/2 -mt-[22px] h-11 w-px ${dark ? "bg-paper-300" : "bg-[#3f3d39]"}`} />
        <span className={`absolute ${yLabel} left-[calc(50%+30px)] normal-case`}>{image.src ? "x 0.500 · y 0.220" : "x 0.500 · y 0.310"}</span>
        <div className="absolute inset-x-5 top-4 flex justify-between gap-4">
          <span>{variant === "alternate" ? t("specimenAlt") : t("specimenBase")}</span>
          <span className="hidden normal-case sm:inline">{variant === "alternate" ? t("metaAlt") : image.src ? `4:5 · ${image.width}×${image.height}` : t("metaBase")}</span>
        </div>
        <span className="absolute right-5 bottom-4 normal-case">{variant === "alternate" ? t("srcAlt") : t("srcBase")}</span>
        {numeral && (
          <span
            className={`absolute bottom-1 left-4 font-display text-[clamp(5.5rem,15vw,16rem)] leading-[0.8] font-bold tracking-[-0.05em] normal-case ${dark ? "text-paper" : "text-ink"} ${image.src ? "opacity-90" : ""}`}
          >
            01
          </span>
        )}
      </div>
    </div>
  );
}

/** Head, neck and shoulders — placeholder geometry from the design, in % of the frame. */
function Silhouette({ dark }: { dark: boolean }) {
  const fill = dark
    ? "border border-[rgb(217_215_208/0.4)] bg-[repeating-linear-gradient(0deg,rgb(217_215_208/0.14)_0_1px,transparent_1px_5px)]"
    : "bg-[#c7c3b9]";
  return (
    <>
      <span className={`absolute top-[17%] left-[33%] aspect-square w-[34%] rounded-full ${fill}`} />
      <span className={`absolute top-[40%] left-[43%] h-[10%] w-[14%] ${fill} ${dark ? "border-y-0" : ""}`} />
      <span className={`absolute top-[48%] right-[8%] bottom-0 left-[8%] rounded-[46%_46%_0_0/34%_34%_0_0] ${fill}`} />
    </>
  );
}
