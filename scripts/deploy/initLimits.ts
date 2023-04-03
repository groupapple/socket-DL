import { Contract, Signer } from "ethers";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { DefenderRelaySigner } from "defender-relay-client/lib/ethers";
import { config } from "./config";
import {
  attestGasLimit,
  chainSlugs,
  executionOverhead,
  proposeGasLimit,
} from "../constants";
import { loadRelayerConfigs } from "./utils/relayer.config";
import { RelayerConfig, relayTxSpeed } from "./utils/types";
import { ChainSocketAddresses } from "../../src/types";
import * as FastSwitchboardABI from "../../artifacts/contracts/switchboard/default-switchboards/FastSwitchboard.sol/FastSwitchboard.json";
import * as OptimisticSwitchboardABI from "../../artifacts/contracts/switchboard/default-switchboards/OptimisticSwitchboard.sol/OptimisticSwitchboard.json";
import * as TransmitManagerABI from "../../artifacts/contracts/TransmitManager.sol/TransmitManager.json";
import { deployedAddressPath } from "../deploy/utils";
import fs from "fs";

export const setLimitsForAChainSlug = async (
  chainSlug: keyof typeof chainSlugs
) => {
  try {
    const chainId = chainSlugs[chainSlug];
    console.log(
      `setting initLimits for chain: ${chainSlug} and chainId: ${chainId}`
    );

    //const deployedAddressConfig: ChainSocketAddresses = await getAddresses(chainId);
    const localChain = "arbitrum-goerli";

    if (!fs.existsSync(deployedAddressPath)) {
      throw new Error("addresses.json not found");
    }
    const addresses = JSON.parse(fs.readFileSync(deployedAddressPath, "utf-8"));

    const deployedAddressConfig: ChainSocketAddresses =
      addresses[chainSlugs[localChain]];

    //const deployedAddressConfig: ChainSocketAddresses = await getAddresses[chainSlugs[localChain]];

    // const addresses = deployedAddresses;

    // console.log(`deployedAddresses are: ${Object.keys(addresses)}`);

    // const deployedAddressConfig: ChainSocketAddresses = addresses[chainId];

    console.log(
      `for chainSlugCode: ${chainSlug} , looked-up deployedAddressConfigs: ${JSON.stringify(
        deployedAddressConfig
      )}`
    );

    const relayerConfigs: Map<number, RelayerConfig> = loadRelayerConfigs();

    //get RelayerConfig for the chainId
    const relayerConfig: RelayerConfig = relayerConfigs.get(
      chainId
    ) as RelayerConfig;

    const provider: StaticJsonRpcProvider = new StaticJsonRpcProvider(
      relayerConfig.rpc
    );

    const signer: Signer = new DefenderRelaySigner(
      {
        apiKey: relayerConfig.ozRelayerKey,
        apiSecret: relayerConfig.ozRelayerSecret,
      },
      provider,
      { speed: relayTxSpeed }
    );

    const integrations = deployedAddressConfig.integrations;

    for (let integration in integrations) {
      console.log(`integration is: ${JSON.stringify(integration)}`);

      //if(integration.)
    }

    //get fastSwitchBoard Address
    const fastSwitchBoardAddress =
      deployedAddressConfig.FastSwitchboard as string;

    const fastSwitchBoardInstance: Contract = new Contract(
      fastSwitchBoardAddress,
      FastSwitchboardABI.abi,
      signer
    );

    //get Optimistic SwitchBoard Address
    const optimisticSwitchBoardAddress =
      deployedAddressConfig.OptimisticSwitchboard as string;

    const optimisticSwitchBoardInstance: Contract = new Contract(
      optimisticSwitchBoardAddress,
      OptimisticSwitchboardABI.abi,
      signer
    );

    //TODO set ExecutionOverhead in OptimisticSwitchboard
    const executionOverheadValue = executionOverhead[chainSlug];

    //TODO set AttestGasLimit in OptimisticSwitchboard
    const attestGasLimitValue = attestGasLimit[chainSlug];

    //get TransmitManager Address
    const transmitManagerAddress =
      deployedAddressConfig.TransmitManager as string;

    const transmitManherInstance: Contract = new Contract(
      transmitManagerAddress,
      TransmitManagerABI.abi,
      signer
    );

    //TODO set ProposeGasLimit in TransmitManager
    const proposeGasLimitValue = proposeGasLimit[chainSlug];
  } catch (error) {
    console.log("Error while sending transaction", error);
    throw error;
  }
};

// npx ts-node scripts/deploy/initLimits.ts
export const setLimits = async () => {
  try {
    const relayerConfigs: Map<number, RelayerConfig> = loadRelayerConfigs();

    // for (let chainSlugCode in chainSlugs.keys) {
    //   setLimitsForAChainSlug(chainSlugCode);
    // }

    setLimitsForAChainSlug("arbitrum-goerli");
  } catch (error) {
    console.log("Error while sending transaction", error);
    throw error;
  }
};

setLimits()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });
