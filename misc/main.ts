// Execute with `deno run --unstable -A main.ts`

import { Webview } from "https://deno.land/x/webview/mod.ts";

const webview = new Webview();

webview.navigate(`https://hashrock-sandbox.github.io/minimal-paint-base/`);
webview.run();