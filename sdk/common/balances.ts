import { ContractsMap, CurrencyKey } from '@synthetixio/contracts-interface';
import { SynthBalancesMap } from '@synthetixio/queries';
import { wei } from '@synthetixio/wei';
import { ethers } from 'ethers';
import { orderBy } from 'lodash';

import { notNill } from 'queries/synths/utils';
import { zeroBN } from 'utils/formatters/number';

type SynthBalancesTuple = [string[], ethers.BigNumber[], ethers.BigNumber[]];

export const getSynthBalances = async (walletAddress: string, contracts: ContractsMap) => {
	const balancesMap: SynthBalancesMap = {};
	const [
		currencyKeys,
		synthsBalances,
		synthsUSDBalances,
	]: SynthBalancesTuple = await contracts.SynthUtil?.synthsBalances(walletAddress);

	let totalUSDBalance = wei(0);

	currencyKeys.forEach((currencyKeyBytes32, idx) => {
		const balance = wei(synthsBalances[idx]);

		if (balance.gt(0)) {
			const synthName = ethers.utils.parseBytes32String(currencyKeyBytes32) as CurrencyKey;
			const usdBalance = wei(synthsUSDBalances[idx]);

			balancesMap[synthName] = { currencyKey: synthName, balance, usdBalance };

			totalUSDBalance = totalUSDBalance.add(usdBalance);
		}
	});

	const balances = {
		balancesMap,
		balances: orderBy(
			Object.values(balancesMap).filter(notNill),
			(balance) => balance.usdBalance.toNumber(),
			'desc'
		),
		totalUSDBalance,
		susdWalletBalance: balancesMap?.['sUSD']?.balance ?? zeroBN,
	};

	return balances;
};
