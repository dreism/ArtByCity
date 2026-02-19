import axios from 'axios';

const SPARQL_ENDPOINT = 'https://query.wikidata.org/sparql';

export interface SparqlResult {
  [key: string]: { type: string; value: string };
}

export async function sparqlQuery(query: string): Promise<SparqlResult[]> {
  const response = await axios.get(SPARQL_ENDPOINT, {
    params: {
      query,
      format: 'json',
    },
    headers: {
      'User-Agent': 'ArtByCity/1.0 (art gallery discovery app)',
      'Accept': 'application/sparql-results+json',
    },
    timeout: 30000,
  });
  return response.data?.results?.bindings || [];
}
