import { storableError } from '../../util/errors';
import { parse } from '../../util/urlHelpers';

// ================ Action types ================ //

export const FETCH_FAVORITES_REQUEST = 'app/FavoritesPage/FETCH_FAVORITES_REQUEST';
export const FETCH_FAVORITES_SUCCESS = 'app/FavoritesPage/FETCH_FAVORITES_SUCCESS';
export const FETCH_FAVORITES_ERROR = 'app/FavoritesPage/FETCH_FAVORITES_ERROR';

// ================ Reducer ================ //

const initialState = {
  favorites: [],
  fetchFavoritesInProgress: false,
  fetchFavoritesError: null,
};

export default function favoritesPageReducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case FETCH_FAVORITES_REQUEST:
      return {
        ...state,
        fetchFavoritesInProgress: true,
        fetchFavoritesError: null,
      };
    case FETCH_FAVORITES_SUCCESS:
      return {
        ...state,
        favorites: payload,
        fetchFavoritesInProgress: false,
      };
    case FETCH_FAVORITES_ERROR:
      return {
        ...state,
        fetchFavoritesInProgress: false,
        fetchFavoritesError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const fetchFavoritesRequest = () => ({ type: FETCH_FAVORITES_REQUEST });
export const fetchFavoritesSuccess = favorites => ({
  type: FETCH_FAVORITES_SUCCESS,
  payload: favorites,
});
export const fetchFavoritesError = e => ({
  type: FETCH_FAVORITES_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

export const loadData = (params, search, config) => (dispatch, getState, sdk) => {
  dispatch(fetchFavoritesRequest());

  // Get favorites from localStorage for now
  // In a real implementation, you would fetch this from the API
  const storedFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  
  if (storedFavorites.length === 0) {
    dispatch(fetchFavoritesSuccess([]));
    return Promise.resolve([]);
  }

  // Fetch the actual listing data for favorited listings
  const listingPromises = storedFavorites.map(listingId =>
    sdk.listings.show({ id: listingId, include: ['author', 'images'] })
  );

  return Promise.all(listingPromises)
    .then(responses => {
      const listings = responses.map(response => response.data.data);
      dispatch(fetchFavoritesSuccess(listings));
      return listings;
    })
    .catch(e => {
      dispatch(fetchFavoritesError(storableError(e)));
    });
};
