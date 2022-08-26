import { NetworkId } from '@synthetixio/contracts-interface';
import request, { gql } from 'graphql-request';
import { useQuery, UseQueryOptions } from 'react-query';
import { useRecoilValue } from 'recoil';
import { useNetwork } from 'wagmi';

import QUERY_KEYS from 'constants/queryKeys';
import useIsL2 from 'hooks/useIsL2';
import { futuresAccountState } from 'store/futures';
import logError from 'utils/logError';

import { FUTURES_POSITION_FRAGMENT } from './constants';
import { PositionHistory } from './types';
import { getFuturesEndpoint, mapTradeHistory } from './utils';

const useGetFuturesPositionForAccount = (options?: UseQueryOptions<any>) => {
	const { selectedFuturesAddress } = useRecoilValue(futuresAccountState);
	const { chain: network } = useNetwork();
	const isL2 = useIsL2();

	const futuresEndpoint = getFuturesEndpoint(network?.id as NetworkId);

	return useQuery<PositionHistory[] | null>(
		QUERY_KEYS.Futures.AccountPositions(selectedFuturesAddress, network?.id as NetworkId),
		async () => {
			try {
				const response = await request(
					futuresEndpoint,
					gql`
						${FUTURES_POSITION_FRAGMENT}
						query userAllPositions($account: String!) {
							futuresPositions(where: { account: $account }) {
								...FuturesPositionFragment
							}
						}
					`,
					{ account: selectedFuturesAddress }
				);
				return response?.futuresPositions ? mapTradeHistory(response.futuresPositions, true) : [];
			} catch (e) {
				logError(e);
				return null;
			}
		},
		{
			enabled: isL2 && !!selectedFuturesAddress,
			refetchInterval: 5000,
			...options,
		}
	);
};

export default useGetFuturesPositionForAccount;
