import { useEffect, useMemo, useState } from "react";

import { Web3Provider as EthersWeb3Provider } from "@ethersproject/providers";

import { Web3Context } from "app/context/web3-context";
import { magic, Relayer } from "app/lib/magic";

interface Web3ProviderProps {
  children: React.ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  //#region state
  const [web3, setWeb3] = useState<EthersWeb3Provider | undefined>(undefined);
  const [mountRelayerOnApp, setMountRelayerOnApp] = useState(true);
  //#endregion

  //#region variables
  const Web3ContextValue = useMemo(
    () => ({
      web3,
      setWeb3,
      setMountRelayerOnApp,
    }),
    [web3]
  );

  useEffect(() => {
    magic.user.isLoggedIn().then((isLoggedIn) => {
      if (magic.rpcProvider && isLoggedIn) {
        const provider = new EthersWeb3Provider(magic.rpcProvider);
        setWeb3(provider);
      }
    });
  }, []);

  //#endregion
  return (
    <Web3Context.Provider value={Web3ContextValue}>
      {children}
      {/* TODO: Open Relayer on FullWindow, need change in relayer source */}
      {mountRelayerOnApp ? <Relayer /> : null}
    </Web3Context.Provider>
  );
}