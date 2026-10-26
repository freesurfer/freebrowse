// FreeBrowse in a React 19 host: the component from `freebrowse/react` (React
// is a peer on this entry, so there is one React on the page). The host owns
// the NiiVue instance and drives it directly; FreeBrowse's UI follows.
import { useMemo } from "react";
import { NiiVue } from "@niivue/niivue";
import { FreeBrowse, configureFreeBrowse } from "freebrowse/react";
import "freebrowse/style.css";

// Once, before the first render: no backend, keep demo prefs out of localStorage.
configureFreeBrowse({ backend: null, persist: false, exposeGlobal: true });

const MNI = "https://niivue.com/demos/images/mni152.nii.gz";

export default function App() {
  const nv = useMemo(
    () => new NiiVue({ backgroundColor: [0.05, 0.05, 0.1, 1] }),
    [],
  );
  return (
    <>
      <h1>My React imaging app</h1>
      <nav>
        <button onClick={() => nv.addVolume({ url: MNI, name: "mni152.nii.gz" })}>
          Load MNI152
        </button>
        <button onClick={() => nv.setVolume(0, { colormap: "Hot" })}>Colormap: hot</button>
        <button
          onClick={() => {
            nv.showRender = 1;
            nv.sliceType = 4;
          }}
        >
          3D render
        </button>
      </nav>
      <div id="viewer">
        {/* hostInstance: seed FreeBrowse's UI from `nv`, never push defaults onto it.
            dragDrop/sidebar/footer off: the host loads data and keeps the chrome minimal. */}
        <FreeBrowse nv={nv} hostInstance dragDrop={false} sidebar={false} footer={false} />
      </div>
    </>
  );
}
