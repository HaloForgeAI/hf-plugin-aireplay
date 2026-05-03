import { definePlugin, registerPlugin } from "@haloforge/plugin-sdk";
import { AIReplayPanel } from "./AIReplayPanel";

registerPlugin("dev.haloforge.aireplay", definePlugin({ panel: AIReplayPanel }));
