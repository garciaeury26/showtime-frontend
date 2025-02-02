import { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { PortalProvider } from "@gorhom/portal";

import { ScrollView } from "@showtime-xyz/universal.scroll-view";
import { Text } from "@showtime-xyz/universal.text";
import { View } from "@showtime-xyz/universal.view";

import { LoginComponent } from "./login";
import { useLogin } from "./use-login";

const ContainerView: any =
  Platform.OS === "android" ? BottomSheetScrollView : ScrollView;
interface LoginProps {
  onLogin?: () => void;
}

export function Login({ onLogin }: LoginProps) {
  //#region hooks
  const {
    walletStatus,
    walletName,
    handleSubmitEmail,
    handleSubmitPhoneNumber,
    handleSubmitWallet,
    loading,
  } = useLogin(onLogin);

  //#endregion

  //#region variables
  const isConnectingToWallet = useMemo(
    () =>
      [
        "CONNECTING_TO_WALLET",
        "CONNECTED_TO_WALLET",
        "FETCHING_NONCE",
        "FETCHED_NONCE",
        "SIGNING_PERSONAL_MESSAGE",
      ].includes(walletStatus),
    [walletStatus]
  );

  //#endregion
  return (
    <PortalProvider>
      <ContainerView style={styles.container}>
        {isConnectingToWallet ? (
          <View tw="py-40">
            <Text tw="text-center dark:text-gray-400">
              {walletName
                ? `Pushed a request to ${walletName}... Please check your wallet.`
                : `Pushed a request to your wallet...`}
            </Text>
          </View>
        ) : (
          <LoginComponent
            handleSubmitEmail={handleSubmitEmail}
            handleSubmitPhoneNumber={handleSubmitPhoneNumber}
            handleSubmitWallet={handleSubmitWallet}
            loading={loading && !isConnectingToWallet}
          />
        )}
      </ContainerView>
    </PortalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
    minHeight: 400,
  },
  tabListItemContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    flex: 1,
    paddingTop: 16,
  },
});
