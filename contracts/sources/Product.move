module brand::product {
    use std::string;
    use aptos_framework::coin;
    use aptos_framework::account;
    use aptos_framework::signer;
    
    struct Brand has key, store {
        name: string::String,
        owner: address,
    }

    struct Product has key, store {
        title: string::String,
        specification: string::String,
        brand: address,
    }

    public entry fun register_brand(
        account: &signer,
        name: string::String
    ) {
        let owner = signer::address_of(account);
        move_to(account, Brand { name, owner });
    }

    public entry fun store_product(
        account: &signer,
        title: string::String,
        specification: string::String
    ) {
        let brand = signer::address_of(account);
        move_to(account, Product { title, specification, brand });
    }
}
