// SOL/USDC/BONK
import { Connection, PublicKey } from "@solana/web3.js";
import { Bank } from "@asgardfi/marginfi-client-v2-patch";
import { aprToApy, percentFormatter } from "@mrgnlabs/mrgn-common";

export enum LendingModes {
    LEND = "lend",
    BORROW = "borrow",
}

export const marginEntrypoint = async (connection: Connection) => {
    // https://storage.googleapis.com/mrgn-public/mrgn-bank-metadata-cache.json

    const solBankPubkey = new PublicKey("CCKtUs6Cgwo4aaQUmBPmyoApH2gUDErxNZCAntD6LYGh") // SOL
    const usdcBankPubkey = new PublicKey("2s37akK2eyBbp8DZgCm7RtsaEz8eJP3Nxd4urLHQv7yB") // USDC
    const bonkBankPubkey = new PublicKey("DeyH7QxWvnbbaVB4zFrf4hoq7Q8z1ZT14co42BGwGtfM") // Bonk
    const usdtBankPubkey = new PublicKey("HmpMfL8942u22htC4EMiWgLX931g3sacXFR6KjuLgKLV") // USDT
    const ethBankPubkey = new PublicKey("BkUyfXjbBBALcfZvw76WAFRvYQ21xxMWWeoPtJrUqG3z") // ETH

    const solTokenBankRaw = await connection.getAccountInfo(solBankPubkey)
    if (!solTokenBankRaw) throw Error("solBankRaw not found")

    const usdcTokenBankRaw = await connection.getAccountInfo(usdcBankPubkey)
    if (!usdcTokenBankRaw) throw Error("usdcBankRaw not found")

    const bonkTokenBankRaw = await connection.getAccountInfo(bonkBankPubkey)
    if (!bonkTokenBankRaw) throw Error("bonkBankRaw not found")

    const usdtTokenBankRaw = await connection.getAccountInfo(usdtBankPubkey)
    if (!usdtTokenBankRaw) throw Error("usdtBankRaw not found")

    const ethTokenBankRaw = await connection.getAccountInfo(ethBankPubkey)
    if (!ethTokenBankRaw) throw Error("ethBankRaw not found")

    const solTokenBank = Bank.fromBuffer(solBankPubkey, solTokenBankRaw.data)
    const usdcTokenBank = Bank.fromBuffer(usdcBankPubkey, usdcTokenBankRaw.data)
    const bonkTokenBank = Bank.fromBuffer(bonkBankPubkey, bonkTokenBankRaw.data)
    const usdtTokenBank = Bank.fromBuffer(usdtBankPubkey, usdtTokenBankRaw.data)
    const ethTokenBank = Bank.fromBuffer(ethBankPubkey, ethTokenBankRaw.data)

    const solDepositTokenIRate = computeBankRate(solTokenBank, LendingModes.LEND);
    const solBorrowTokenIRate = computeBankRate(solTokenBank, LendingModes.BORROW);

    const usdcDepositTokenIRate = computeBankRate(usdcTokenBank, LendingModes.LEND);
    const usdcBorrowTokenIRate = computeBankRate(usdcTokenBank, LendingModes.BORROW);

    const bonkDepositTokenIRate = computeBankRate(bonkTokenBank, LendingModes.LEND);
    const bonkBorrowTokenIRate = computeBankRate(bonkTokenBank, LendingModes.BORROW);

    const usdtDepositTokenIRate = computeBankRate(usdtTokenBank, LendingModes.LEND);
    const usdtBorrowTokenIRate = computeBankRate(usdtTokenBank, LendingModes.BORROW);

    const ethDepositTokenIRate = computeBankRate(ethTokenBank, LendingModes.LEND);
    const ethBorrowTokenIRate = computeBankRate(ethTokenBank, LendingModes.BORROW);

    return {
        SOL: {
            deposit: solDepositTokenIRate.apyRate,
            borrow: solBorrowTokenIRate.apyRate,
        },
        USDC: {
            deposit: usdcDepositTokenIRate.apyRate,
            borrow: usdcBorrowTokenIRate.apyRate,
        },
        BONK: {
            deposit: bonkDepositTokenIRate.apyRate,
            borrow: bonkBorrowTokenIRate.apyRate,
        },
        USDT: {
            deposit: usdtDepositTokenIRate.apyRate,
            borrow: usdtBorrowTokenIRate.apyRate,
        },
        ETH: {
            deposit: ethDepositTokenIRate.apyRate,
            borrow: ethBorrowTokenIRate.apyRate,
        }
    }
}

export function computeBankRate(bank: Bank, lendingMode: LendingModes) {
    const isInLendingMode = lendingMode === LendingModes.LEND;

    const interestRate = isInLendingMode ? bank.computeInterestRates().lendingRate : bank.computeInterestRates().borrowingRate;

    const emissionRate = isInLendingMode
        ? bank.emissionsActiveLending == true
            ? bank.emissionsRate
            : 0
        : bank.emissionsActiveBorrowing == true
            ? bank.emissionsRate
            : 0;

    const aprRate = interestRate.toNumber() + emissionRate;
    const apyRate = aprToApy(aprRate);
    const formattedAPR = percentFormatter.format(aprRate);
    const formattedAPY = percentFormatter.format(apyRate);

    return { aprRate, apyRate, formattedAPR, formattedAPY }
}