import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";


class AptosService {
  private static instance: AptosService;
  private aptos: Aptos | null = null;
  private config: AptosConfig | null = null;

  private constructor() {}

  public static getInstance(): AptosService {
    if (!AptosService.instance) {
      AptosService.instance = new AptosService();
    }
    return AptosService.instance;
  }

  public async connect(network: Network = Network.DEVNET): Promise<Aptos> {

    // Setup the client config
    this.config = new AptosConfig({ network });
    
    // Create Aptos instance
    this.aptos = new Aptos(this.config);
    
    return this.aptos;
  }

  public async getAptos(): Promise<Aptos> {
    if (!this.aptos) {
      return this.connect();
    }
    return this.aptos;
  }

  public getAptosConfig(): AptosConfig | null {
    return this.config;
  }
}

// Export the singleton instance getter
export const aptosService = AptosService.getInstance();

// Default export for easy importing
export default aptosService;