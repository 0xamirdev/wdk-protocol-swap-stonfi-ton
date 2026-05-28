export default class StonfiProtocolTon extends SwapProtocol {
    /**
     * Creates a new read-only interface to the stonfi protocol for the ton blockchain.
     *
     * @overload
     * @param {IWalletAccountReadOnly} account - The wallet account to use to interact with the protocol.
     * @param {StonfiProtocolConfig} [config] - The stonfi protocol configuration.
     */
    constructor(account: IWalletAccountReadOnly, config?: StonfiProtocolConfig);
    /**
     * Creates a new interface to the stonfi protocol for the ton blockchain.
     *
     * @overload
     * @param {IWalletAccount} account - The wallet account to use to interact with the protocol.
     * @param {StonfiProtocolConfig} [config] - The stonfi protocol configuration.
     */
    constructor(account: IWalletAccount, config?: StonfiProtocolConfig);
    /**
     * Ston.fi API client.
     *
     * @private
     * @type {StonApiClient}
     */
    private _apiClient;
    /**
     * Internal helper to open TonClient.
     *
     * @private
     * @returns {TonClient}
     */
    private _getTonClient;
}
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type IWalletAccountReadOnly = import("@tetherto/wdk-wallet").IWalletAccountReadOnly;
export type SwapOptions = import("@tetherto/wdk-wallet/protocols").SwapOptions;
export type SwapResult = import("@tetherto/wdk-wallet/protocols").SwapResult;
export type StonfiProtocolConfig = {
    /**
     * - The maximum fee amount for swap operations.
     */
    swapMaxFee?: number | bigint;
    /**
     * - Optional fallback TON RPC endpoint.
     */
    tonRpcEndpoint?: string;
};
import { SwapProtocol } from '@tetherto/wdk-wallet/protocols';
