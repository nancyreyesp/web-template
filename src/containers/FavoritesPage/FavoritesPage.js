import React, { useEffect } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';
import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { isScrollingDisabled } from '../../ducks/ui.duck';
import { getMarketplaceEntities } from '../../ducks/marketplaceData.duck';
import {
  H3,
  Page,
  UserNav,
  LayoutSingleColumn,
  ListingCard,
} from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import { loadData } from './FavoritesPage.duck';
import css from './FavoritesPage.module.css';

const Heading = props => {
  const { favorites } = props;
  const count = favorites ? favorites.length : 0;

  return count > 0 ? (
    <H3 as="h1" className={css.heading}>
      <FormattedMessage
        id="FavoritesPage.heading"
        values={{ count }}
      />
    </H3>
  ) : (
    <div className={css.noResultsContainer}>
      <H3 as="h1" className={css.headingNoFavorites}>
        <FormattedMessage id="FavoritesPage.noFavorites" />
      </H3>
      <p className={css.noFavoritesParagraph}>
        <FormattedMessage id="FavoritesPage.noFavoritesDescription" />
      </p>
    </div>
  );
};

export const FavoritesPageComponent = props => {
  const config = useConfiguration();
  const intl = useIntl();

  const {
    currentUser,
    favorites,
    scrollingDisabled,
  } = props;

  const hasPaginationInfo = !!favorites;
  const listingsAreLoaded = hasPaginationInfo;

  const title = intl.formatMessage({ id: 'FavoritesPage.title' });

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSingleColumn
        topbar={
          <TopbarContainer
            currentPage="FavoritesPage"
            currentSearchParams={{}}
          />
        }
        footer={<FooterContainer />}
      >
        <UserNav currentPage="FavoritesPage" />
        <div className={css.listingPanel}>
          <Heading favorites={favorites} />
          <div className={css.listingCards}>
            {favorites && favorites.map(l => (
              <ListingCard
                className={css.listingCard}
                key={l.id.uuid}
                listing={l}
                renderSizes="(max-width: 767px) 100vw, 360px"
              />
            ))}
          </div>
        </div>
      </LayoutSingleColumn>
    </Page>
  );
};

FavoritesPageComponent.defaultProps = {
  currentUser: null,
  favorites: [],
};

const mapStateToProps = state => {
  const { currentUser } = state.user;
  const { favorites } = state.FavoritesPage;

  return {
    currentUser,
    favorites,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = dispatch => ({});

const FavoritesPage = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(FavoritesPageComponent);

FavoritesPage.loadData = loadData;

export default FavoritesPage;
