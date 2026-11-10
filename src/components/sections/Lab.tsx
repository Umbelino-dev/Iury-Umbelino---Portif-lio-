import { SectionTitle } from "@/components/layout/SectionTitle";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { lab } from "@/content/lab";
import type { LabEntry } from "@/content/types";
import type { Locale } from "@/i18n/routing";
import { StatusMark } from "@/components/layout/StatusMark";
import { LabFrame } from "./LabFrame";

/**
 * 05 · Lab — dark editorial. "Projects are evidence, so they sit in daylight. The Lab
 * is possibility again, so the page goes back to night" (Homepage R02 · N12).
 *
 * Controlled broken grid (N13): the 12 columns stay visible, and each entry breaks
 * them once — E.01's numeral cuts its frame, E.02 drops and bleeds off the right
 * edge, E.03 is indented with its text beside it. Below ~720px everything stacks.
 * Each entry is a frame, not a box: hairline, crop marks, mono spec bar, big numeral.
 *
 * The cat's perch on E.01 is reserved for the single CatAssistant (M5).
 */
export async function Lab() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("lab");
  const ts = await getTranslations("status");
  const [e1, e2, e3] = lab;
  if (!e1 || !e2 || !e3) return null;

  const numeral =
    "pointer-events-none absolute z-20 font-display text-[clamp(5.5rem,11vw,12.5rem)] leading-[0.8] font-bold tracking-[-0.05em] text-paper";
  const entryText = (e: LabEntry, maxCh: string) => (
    <div className="flex flex-col gap-3.5">
      <p className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 font-mono text-[11px] tracking-[0.04em] text-gray-500 uppercase">
        <span>{e.index}</span>
        <span>{e.topic[locale]}</span>
        {e.year && <span>{e.year}</span>}
        <StatusMark status={e.status} label={ts(e.status)} className="font-sans text-label text-paper-300 normal-case tracking-normal" />
      </p>
      <h3 className="font-display text-[clamp(1.875rem,1.2rem+2.6vw,3.5rem)] leading-[0.96] font-bold tracking-[-0.03em] text-balance">
        {e.title[locale]}
      </h3>
      <p className={`text-[0.9375rem] leading-normal text-pretty text-paper-300 ${maxCh}`}>{e.body[locale]}</p>
    </div>
  );

  return (
    <section
      id="lab"
      data-nav-id="lab"
      data-surface="dark"
      aria-labelledby="lab-title"
      className="relative isolate overflow-hidden bg-ink py-[clamp(7rem,10vw,11.25rem)] text-paper"
    >
      <LabBackdrop />

      <div className="mx-auto max-w-(--container-page) px-(--page-margin)">
        <header className="relative flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <div className="flex flex-col gap-[clamp(0.75rem,1.4vw,1.5rem)]">
            <SectionTitle id="lab-title">{t("title")}</SectionTitle>
          </div>
          <div className="flex max-w-[380px] flex-col gap-4 pb-[0.4em]">
            <p className="font-display text-[clamp(1.25rem,1.1rem+0.7vw,1.75rem)] leading-[1.15] font-medium tracking-[-0.015em] text-balance">
              {t("intro")}
            </p>
            <p className="font-mono text-[11px] tracking-[0.04em] text-gray-500 uppercase">{t("meta", { count: lab.length })}</p>
          </div>
        </header>

        <ol className="relative flex flex-col gap-y-[clamp(4.5rem,8vw,8.75rem)] pt-[clamp(4.5rem,7vw,8rem)] min-[720px]:flex-row min-[720px]:flex-wrap min-[720px]:items-start">
          {/* E.01 — numeral cuts the frame */}
          <li className="flex w-full flex-col gap-7 pt-[clamp(4rem,9vw,9.5rem)] min-[720px]:w-[max(300px,41.66%)]">
            <div className="relative">
              <CropMarks />
              <span aria-hidden="true" className={`${numeral} top-0 -left-[0.04em] -translate-y-[64%]`}>
                01
              </span>
              <LabFrame cube className="aspect-square bg-[#141414]">
                <Media entry={e1} locale={locale} />
                {!e1.media && <Cube />}
                <span aria-hidden="true" className="absolute inset-x-[12%] bottom-[22%] h-px bg-[repeating-linear-gradient(90deg,#5e5c57_0_4px,transparent_4px_8px)]" />
                <span aria-hidden="true" className="absolute bottom-[calc(22%+8px)] left-[12%] font-mono text-[10px] text-gray-500">
                  {t("ground")}
                </span>
                <SpecBar left="" right={`${e1.index} / 3D · 1:1`} drop={t("drop")} />
              </LabFrame>
            </div>
            {entryText(e1, "max-w-[30ch]")}
          </li>

          {/* E.02 — drops low and bleeds off the right edge */}
          <li className="flex w-full flex-col gap-7 min-[720px]:mt-[clamp(0px,calc((100vw-720px)*0.3),340px)] min-[720px]:-mr-(--page-margin) min-[720px]:ml-auto min-[720px]:w-[max(260px,33.33%)]">
            <div className="min-[720px]:pr-(--page-margin)">{entryText(e2, "max-w-[28ch]")}</div>
            <div className="relative min-[720px]:pr-(--page-margin)">
              <CropMarks inset="min-[720px]:[--crop-right:calc(var(--page-margin)-9px)]" />
              <span aria-hidden="true" className={`${numeral} right-[0.02em] bottom-0 translate-y-[46%] min-[720px]:right-[calc(var(--page-margin)+0.02em)]`}>
                02
              </span>
              <LabFrame className="aspect-[3/4] bg-[repeating-linear-gradient(135deg,#181818_0_6px,#141414_6px_12px)]">
                <Media entry={e2} locale={locale} />
                {!e2.media && (
                  <>
                    <span aria-hidden="true" className="absolute inset-x-3.5 inset-y-11 bg-[linear-gradient(90deg,rgb(243_241_235/0.06)_1px,transparent_1px),linear-gradient(0deg,rgb(243_241_235/0.06)_1px,transparent_1px)] bg-size-[24px_24px]" />
                    <span aria-hidden="true" className="absolute top-[58%] left-[30%] size-2.5 rounded-full border border-paper" />
                    <span aria-hidden="true" className="absolute top-[58%] left-[calc(30%+16px)] font-mono text-[10px] text-gray-500">
                      {t("hesitation")}
                    </span>
                  </>
                )}
                <SpecBar left={`${e2.index} / POINTER`} right="3:4" drop={t("drop")} dropLeft />
              </LabFrame>
            </div>
          </li>

          {/* E.03 — indented two columns, text beside */}
          <li className="flex w-full flex-wrap items-end gap-x-[clamp(1.5rem,3vw,3.5rem)] gap-y-8 min-[720px]:ml-[clamp(0px,calc((100vw-720px)*0.18),240px)] min-[720px]:w-[max(320px,83.33%)]">
            <div className="relative min-w-0 flex-[1_1_440px] pt-[clamp(3rem,5vw,5.5rem)]">
              <div className="relative">
                <CropMarks />
                <span aria-hidden="true" className={`${numeral} top-0 -right-[0.04em] -translate-y-[64%]`}>
                  03
                </span>
                <LabFrame className="aspect-video bg-[#141414]">
                  <Media entry={e3} locale={locale} />
                  {!e3.media && <Score playhead={t("playhead")} />}
                  {/* Spec on the left: the "03" numeral cuts the top-right corner. */}
                  <SpecBar left={`${e3.index} / ${e3.topic.en.toUpperCase()} · 16:9`} right="" drop={t("drop")} />
                </LabFrame>
              </div>
            </div>
            <div className="flex-[0_1_300px]">{entryText(e3, "max-w-[28ch]")}</div>
          </li>
        </ol>
      </div>
    </section>
  );
}

function Media({ entry, locale }: { entry: LabEntry; locale: Locale }) {
  if (!entry.media) return null;
  return (
    <Image
      src={entry.media.src}
      alt={entry.media.alt[locale]}
      width={entry.media.width}
      height={entry.media.height}
      sizes="(min-width: 720px) 50vw, 100vw"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function SpecBar({ left, right, drop, dropLeft = false }: { left: string; right: string; drop: string; dropLeft?: boolean }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 font-mono text-[11px] tracking-[0.04em]">
      <span className="absolute inset-x-3.5 top-3 flex justify-between gap-3 text-paper-300">
        <span>{left}</span>
        <span>{right}</span>
      </span>
      <span className={`absolute bottom-3 text-gray-500 ${dropLeft ? "left-3.5" : "right-3.5"}`}>{drop}</span>
    </span>
  );
}

/** Crop marks outside the four corners. `inset` can move the right pair (E.02 bleeds). */
function CropMarks({ inset = "" }: { inset?: string }) {
  const mark = "pointer-events-none absolute size-3.5 border-gray-600";
  const right = "right-[var(--crop-right,-9px)]";
  return (
    <span aria-hidden="true" className={`[--crop-right:-9px] ${inset}`}>
      <span className={`${mark} -top-[9px] -left-[9px] border-t border-l`} />
      <span className={`${mark} -top-[9px] ${right} border-t border-r`} />
      <span className={`${mark} -bottom-[9px] -left-[9px] border-b border-l`} />
      <span className={`${mark} -bottom-[9px] ${right} border-b border-r`} />
    </span>
  );
}

/** Wireframe cube in CSS 3D — turned by LabFrame on pointer move. */
function Cube() {
  const faces = ["rotateY(0deg)", "rotateY(90deg)", "rotateY(180deg)", "rotateY(-90deg)", "rotateX(90deg)", "rotateX(-90deg)"];
  return (
    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center perspective-[700px]">
      <span
        data-cube
        className="relative size-(--s) transform-3d transition-transform duration-[600ms] ease-(--ease-out-soft) [--s:clamp(80px,9vw,150px)] [transform:rotateX(-22deg)_rotateY(34deg)]"
      >
        {faces.map((f) => (
          <span
            key={f}
            className="absolute inset-0 border border-paper/60 bg-paper/[0.025]"
            style={{ transform: `${f} translateZ(calc(var(--s) / 2))` }}
          />
        ))}
      </span>
    </span>
  );
}

/** A typed sentence as a score: bars on a baseline and a playhead. Deterministic, no JS. */
function Score({ playhead }: { playhead: string }) {
  const bars = Array.from({ length: 56 }, (_, i) => 18 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45)) * 62));
  return (
    <span aria-hidden="true" className="absolute inset-x-[6%] inset-y-[22%] flex items-center gap-[3px]">
      {bars.map((h, i) => (
        <span key={i} className={`flex-1 ${i < 21 ? "bg-paper/70" : "bg-paper/20"}`} style={{ height: `${h}%` }} />
      ))}
      <span className="absolute inset-y-[-12%] left-[37%] w-px bg-signal" />
      <span className="absolute -top-[22%] left-[calc(37%+8px)] font-mono text-[10px] whitespace-nowrap text-gray-500">{playhead}</span>
    </span>
  );
}

function LabBackdrop() {
  const grain =
    "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-0 opacity-[0.07] mix-blend-screen" style={{ backgroundImage: grain, backgroundSize: "240px 240px" }} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_40%,rgba(243,241,235,0.05),transparent_70%)]" />
      <div className="lab-columns absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_50%_45%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}
