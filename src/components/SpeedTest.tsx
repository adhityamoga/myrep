import { useState, useEffect, useRef } from "react";
import { Activity, Download, Globe, MapPin, Network, Server, Upload, Wifi, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

import gaugeGray from "@/assets/speedometer-gray.png";
import gaugePurple from "@/assets/speedometer-purple.png";

export function SpeedTest() {
  const [isTesting, setIsTesting] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  const needleRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsTesting(false);
          setTimeout(() => setIsTesting(true), 100);
        }
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isTesting) {
      if (numberRef.current) numberRef.current.innerText = "0.00";
      if (needleRef.current) needleRef.current.style.transform = `rotate(135deg)`;
      if (maskRef.current) {
        maskRef.current.style.webkitMaskImage = `conic-gradient(from 225deg, black 0deg, black 0deg, transparent 0deg)`;
        maskRef.current.style.maskImage = `conic-gradient(from 225deg, black 0deg, black 0deg, transparent 0deg)`;
      }
      return;
    }

    let startTime: number | null = null;
    const duration = 2500;

    interface Keyframe {
      t: number;
      val: number;
      angle: number;
      maskAngle: number;
    }

    const keyframes: Keyframe[] = [
      { t: 0, val: 0, angle: 135, maskAngle: 0 },
      { t: 0.3, val: 50, angle: 270, maskAngle: 135 },
      { t: 0.5, val: 120, angle: 360, maskAngle: 225 }, // Overshoot
      { t: 0.65, val: 70, angle: 290, maskAngle: 155 }, // Shake back
      { t: 0.75, val: 110, angle: 330, maskAngle: 195 }, // Shake forward
      { t: 0.85, val: 95, angle: 310, maskAngle: 175 }, // Settle back
      { t: 1.0, val: 100, angle: 315, maskAngle: 180 }, // Final exactly 100
    ];

    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      let progress = elapsed / duration;
      if (progress > 1) progress = 1;

      const p = 1 - Math.pow(1 - progress, 3);

      let currentK = keyframes[0]!;
      let nextK = keyframes[keyframes.length - 1]!;

      for (let i = 0; i < keyframes.length - 1; i++) {
        const curr = keyframes[i];
        const next = keyframes[i + 1];
        if (curr && next && p >= curr.t && p <= next.t) {
          currentK = curr;
          nextK = next;
          break;
        }
      }

      const segmentProgress = (p - currentK.t) / (nextK.t - currentK.t);
      const val = currentK.val + (nextK.val - currentK.val) * segmentProgress;
      const angle = currentK.angle + (nextK.angle - currentK.angle) * segmentProgress;
      const maskAngle =
        currentK.maskAngle + (nextK.maskAngle - currentK.maskAngle) * segmentProgress;

      if (numberRef.current) numberRef.current.innerText = Math.max(0, val).toFixed(2);
      if (needleRef.current) needleRef.current.style.transform = `rotate(${angle}deg)`;

      if (maskRef.current) {
        const maskStr = `conic-gradient(from 225deg, black 0deg, black ${maskAngle}deg, transparent ${maskAngle}deg)`;
        maskRef.current.style.webkitMaskImage = maskStr;
        maskRef.current.style.maskImage = maskStr;
      }

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        if (numberRef.current) numberRef.current.innerText = "100.00";
        if (needleRef.current) needleRef.current.style.transform = `rotate(315deg)`;
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isTesting]);

  return (
    <section
      id="speedtest"
      ref={containerRef}
      className="bg-soft px-4 py-20 sm:py-24 lg:px-8 overflow-hidden"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center mb-10">
          <p className="section-kicker">Speed Test</p>
          <h2 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">
            Kecepatan Nyata, Bukan Janji
          </h2>
        </div>

        <div className="w-full px-2 sm:px-0">
          <div className="mx-auto grid max-w-6xl grid-cols-[52px_1fr_52px] items-center justify-center gap-3 sm:grid-cols-[180px_1fr_180px] sm:gap-6 lg:grid-cols-[200px_1fr_200px] lg:gap-10">
            <div className="flex flex-col gap-2 sm:gap-3">
              <Button
                variant="brand"
                size="lg"
                className="w-full font-bold shadow-sm px-0 sm:px-8 h-12 sm:h-auto"
                onClick={() => {
                  setIsTesting(false);
                  setTimeout(() => setIsTesting(true), 50);
                }}
              >
                <span className="hidden sm:inline">Test Again</span>
                <RefreshCcw className="size-5 sm:hidden" />
              </Button>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Globe className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">IP Address</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">172.168.212.104</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <MapPin className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Location</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Purwokerto, ID</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Server className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Server</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">MyRepublic JKT</p>
                </div>
              </div>
            </div>

            <div className="relative mx-auto flex w-full max-w-[480px] flex-col items-center justify-center">
              <div className="relative aspect-square w-full z-10">
                <img
                  src={gaugeGray}
                  alt=""
                  className="absolute inset-0 size-full object-contain drop-shadow-sm"
                />

                <div
                  ref={maskRef}
                  className="absolute inset-0 size-full opacity-0 transition-opacity duration-300"
                  style={{ opacity: isTesting ? 1 : 0 }}
                >
                  <img src={gaugePurple} alt="" className="size-full object-contain" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    ref={needleRef}
                    className="absolute inset-0 size-full"
                    style={{ transform: "rotate(135deg)" }}
                  >
                    <div className="absolute left-1/2 top-1/2 h-[4px] sm:h-[5px] w-[28%] -translate-y-1/2 origin-left rounded-full bg-brand shadow-md" />
                  </div>
                  <div className="absolute size-5 sm:size-7 rounded-full bg-brand shadow-md border-4 sm:border-[5px] border-background z-20" />
                </div>
              </div>

              <div className="relative z-20 mt-[-0.5rem] sm:mt-[-2rem] text-center bg-soft/50 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2 sm:p-4">
                <span className="text-4xl sm:text-7xl lg:text-[5.5rem] font-black text-brand tracking-tighter">
                  <span ref={numberRef}>0.00</span>
                </span>
                <p className="text-[10px] sm:text-base font-bold text-muted-foreground flex items-center justify-center gap-1 sm:mt-2">
                  <Activity className="size-3 sm:size-5" /> Mbps
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-signal p-2 sm:p-3 rounded-lg shadow-sm border border-signal">
                <div className="grid size-8 shrink-0 place-items-center bg-background/50 text-signal-foreground rounded-md">
                  <Download className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-signal-foreground leading-tight">Download</p>
                  <p className="text-[10px] text-signal-foreground/80 font-bold mt-0.5">
                    100.00 Mbps
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Upload className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Upload</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">73.50 Mbps</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Network className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Idle Latency</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">12 ms</p>
                </div>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-3 bg-background p-2 sm:p-3 rounded-lg shadow-sm border border-border">
                <div className="grid size-8 shrink-0 place-items-center bg-brand/10 text-brand rounded-md">
                  <Wifi className="size-4" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold leading-tight">Wi-Fi Name</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Home-Fiber</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
