import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../util/reactIntl';

import css from './FavoriteButton.module.css';

/**
 * FavoriteButton component to add/remove listings from favorites
 */
const FavoriteButton = props => {
  const { className, listingId, isAuthenticated } = props;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Check if this listing is already in favorites
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(listingId));
  }, [listingId, isAuthenticated]);

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      // Redirect to login or show message
      alert('Please log in to save favorites');
      return;
    }

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    if (isFavorite) {
      // Remove from favorites
      const newFavorites = favorites.filter(id => id !== listingId);
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      // Add to favorites
      const newFavorites = [...favorites, listingId];
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setIsFavorite(true);
    }
  };

  const classes = classNames(css.root, className, {
    [css.active]: isFavorite,
  });

  return (
    <button
      type="button"
      className={classes}
      onClick={handleToggleFavorite}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={css.icon}
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <span className={css.text}>
        {isFavorite ? (
          <FormattedMessage id="FavoriteButton.saved" />
        ) : (
          <FormattedMessage id="FavoriteButton.save" />
        )}
      </span>
    </button>
  );
};

export default FavoriteButton;
