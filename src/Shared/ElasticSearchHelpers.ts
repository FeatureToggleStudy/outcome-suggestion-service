import * as request from 'request-promise';
import { SearchResponse } from 'elasticsearch';
import { StandardOutcome } from '@cyber4all/clark-entity';
import { RequestError, StatusCodeError } from 'request-promise/errors';
import {
  ResourceError,
  ResourceErrorReason,
  ServiceError,
  ServiceErrorReason,
} from './Errors';

const ELASTIC_SEARCH_URI = process.env.ELASTIC_SEARCH_URI;
const GUIDELINE_URI = `${ELASTIC_SEARCH_URI}/guidelines/_search`;

export interface ElasticSearchQuery {
  query: { [queryKey: string]: any };
}

export interface ElasticSearchPaginator {
  from: number;
  size: number;
}

/**
 * Queries guidelines within the ElasticSearch node
 *
 * @export
 * @param {ElasticSearchQuery} query [The query]
 * @returns {Promise<{
 *   total: number;
 *   outcomes: StandardOutcome[];
 * }>}
 */
export function queryGuidelines(
  query: ElasticSearchQuery,
): Promise<{
  total: number;
  outcomes: StandardOutcome[];
}> {
  return new Promise<{
    total: number;
    outcomes: StandardOutcome[];
  }>((resolve, reject) => {
    request({
      uri: GUIDELINE_URI,
      json: true,
      body: query,
    })
      .then((res: SearchResponse<Partial<StandardOutcome>>) =>
        resolve(toPaginatedGuidelines(res)),
      )
      .catch(transformRequestError)
      .catch((e: Error) => reject(e));
  });
}

/**
 *  Converts ElasticSearch SearchResponse to object with document totals and outcomes
 *
 * @private
 * @param {SearchResponse<Partial<StandardOutcome>>} results
 * @returns {{ total: number; outcomes: StandardOutcome[] }}
 */
function toPaginatedGuidelines(
  results: SearchResponse<Partial<StandardOutcome>>,
): { total: number; outcomes: StandardOutcome[] } {
  const total = results.hits.total;
  let outcomes: StandardOutcome[] = [];
  const guidelineHits = results.hits.hits;
  outcomes = guidelineHits.map(hit => {
    const outcome = hit._source;
    return new StandardOutcome({
      ...outcome,
      date: `${outcome.date}`,
    });
  });
  return { total, outcomes };
}

/**
 * Transforms errors from `request-promise` to service specific error types
 *
 * @private
 * @param {RequestError} e [The error object thrown]
 * @param {string} message [Custom error message]
 * @memberof HttpLearningObjectGateway
 */
function transformRequestError(e: RequestError, message?: string) {
  if (e instanceof StatusCodeError) {
    switch (e.statusCode) {
      case 400:
        throw new ResourceError(
          message || 'Unable to load resource',
          ResourceErrorReason.BAD_REQUEST,
        );
      case 401:
        throw new ResourceError(
          message || 'Invalid access',
          ResourceErrorReason.INVALID_ACCESS,
        );
      case 404:
        throw new ResourceError(
          message || 'Unable to load resource',
          ResourceErrorReason.NOT_FOUND,
        );
      case 500:
        throw new ServiceError(ServiceErrorReason.INTERNAL);
      default:
        break;
    }
  }
  throw new ServiceError(ServiceErrorReason.INTERNAL);
}

/**
 * Builds pagination object
 *
 * @private
 * @param {number} limit [The maximum amount results to return]
 * @param {number} page [The page of results to return]
 * @returns {ElasticSearchPaginator}
 * @memberof ElasticSearchGateway
 */
export function buildPaginator({
  limit,
  page,
}: {
  limit: number;
  page: number;
}): ElasticSearchPaginator {
  const paginator = { from: 0, size: 0 };
  paginator.size = limit;
  paginator.from = 0;
  if (page != null) {
    page = page <= 0 ? 1 : page;
    const skip = (page - 1) * limit;
    paginator.from = skip;
  }
  return paginator;
}
