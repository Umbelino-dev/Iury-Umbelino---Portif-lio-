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
 * A broken composition: the first entry stands high on the left, the second drops
 * and bleeds off the right edge, the third is indented with its text beside it.
 * Below ~720px everything stacks. No numerals, codes, crop marks or grid lines:
 * each entry is its own picture, a title and a line in serif saying where it is.
 *
 * E.01 shows the cat's 3D model (Sr. Bigodes): a still render that the pointer
 * turns through a pre-rendered 360° sheet (see LabFrame).
 */
export async function Lab() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations("lab");
  const ts = await getTranslations("status");
  const tc = await getTranslations("cursor");
  const [e1, e2, e3] = lab;
  if (!e1 || !e2 || !e3) return null;

  const entryText = (e: LabEntry, maxCh: string) => (
    <div className="flex flex-col gap-3.5">
      <p className="text-note text-[1.25rem] text-paper-300">
        {e.topic[locale]}, <StatusMark status={e.status} label={ts(e.status).toLowerCase()} />
        {e.year ? `, ${e.year}` : ""}
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
            <p className="text-note text-[1.125rem] text-gray-500">{t("meta", { count: lab.length })}</p>
          </div>
        </header>

        <ol className="relative flex flex-col gap-y-[clamp(4.5rem,8vw,8.75rem)] pt-[clamp(4.5rem,7vw,8rem)] min-[720px]:flex-row min-[720px]:flex-wrap min-[720px]:items-start">
          {/* First entry: high on the left */}
          <li className="flex w-full flex-col gap-7 min-[720px]:w-[max(300px,41.66%)]">
            <div className="relative">
              <LabFrame turntable={e1.turntable} cursorLabel={tc("turn")} className="aspect-square bg-[#141414]">
                <Media entry={e1} locale={locale} />
                {!e1.media && <Pending text={t("drop")} />}
              </LabFrame>
            </div>
            {entryText(e1, "max-w-[30ch]")}
          </li>

          {/* Second entry: drops low and bleeds off the right edge */}
          <li className="flex w-full flex-col gap-7 min-[720px]:mt-[clamp(0px,calc((100vw-720px)*0.3),340px)] min-[720px]:-mr-(--page-margin) min-[720px]:ml-auto min-[720px]:w-[max(260px,33.33%)]">
            <div className="min-[720px]:pr-(--page-margin)">{entryText(e2, "max-w-[28ch]")}</div>
            <div className="relative min-[720px]:pr-(--page-margin)">
              <LabFrame className="aspect-[3/4] bg-[#161616]">
                <Media entry={e2} locale={locale} />
                {!e2.media && (
                  <>
                    <Trace label={t("hesitation")} />
                    <Pending text={t("drop")} />
                  </>
                )}
              </LabFrame>
            </div>
          </li>

          {/* Third entry: indented, text beside */}
          <li className="flex w-full flex-wrap items-end gap-x-[clamp(1.5rem,3vw,3.5rem)] gap-y-8 min-[720px]:ml-[clamp(0px,calc((100vw-720px)*0.18),240px)] min-[720px]:w-[max(320px,83.33%)]">
            <div className="relative min-w-0 flex-[1_1_440px]">
              <div className="relative">
                <LabFrame className="aspect-video bg-[#141414]">
                  <Media entry={e3} locale={locale} />
                  {!e3.media && (
                    <>
                      <Score playhead={t("playhead")} />
                      <Pending text={t("drop")} />
                    </>
                  )}
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
      className="absolute inset-0 h-full w-full object-cover group-data-[turning=true]/frame:opacity-0"
    />
  );
}

/** The honest note on a frame without media, in the annotation voice. */
function Pending({ text }: { text: string }) {
  return (
    <span aria-hidden="true" className="text-note pointer-events-none absolute bottom-4 left-5 text-[1rem] text-gray-500">
      {text}
    </span>
  );
}

/**
 * A pointer's path drawn as one hand-made stroke: it wanders, slows, loops once
 * where it hesitated, then leaves. The hesitation is marked by a ring.
 */
function Trace({ label }: { label: string }) {
  return (
    <span aria-hidden="true" className="absolute inset-0">
      <svg viewBox="0 0 300 400" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" fill="none">
        <path
          d="M18 72 C 70 60, 92 118, 128 150 S 170 214, 104 236 S 60 284, 98 230 S 150 196, 92 236 C 74 250, 92 268, 116 262 C 168 248, 210 300, 282 330"
          stroke="rgb(243 241 235 / 0.55)"
          strokeWidth="1.5"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="absolute top-[58%] left-[31%] size-4 -translate-1/2 rounded-full border border-paper" />
      <span className="text-note absolute top-[58%] left-[calc(31%+18px)] -translate-y-1/2 text-[1rem] text-paper-300">{label}</span>
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
      <span className="text-note absolute -top-[26%] left-[calc(37%+8px)] text-[1rem] whitespace-nowrap text-paper-300">{playhead}</span>
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_85%_at_50%_45%,transparent_55%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  );
}
