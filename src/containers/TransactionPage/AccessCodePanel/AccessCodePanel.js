import React, { useState } from 'react';
import classNames from 'classnames';
import { FormattedMessage } from '../../../util/reactIntl';
import { IconKeys } from '../../../components';
import { post } from '../../../util/api';

import css from './AccessCodePanel.module.css';

/**
 * AccessCodePanel displays the TTLock PIN code for the booking
 */
const AccessCodePanel = props => {
  const { className, transaction, transactionRole } = props;
  const [pinGenerated, setPinGenerated] = useState(false);
  const [pin, setPin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isCustomer = transactionRole === 'customer';
  const metadata = transaction?.attributes?.metadata;
  const ttlockData = metadata?.ttlock;
  
  // Check if transaction is in accepted state
  const currentState = transaction?.attributes?.lastTransition;
  const isAccepted = currentState === 'transition/accept' || currentState === 'transition/operator-accept';
  
  // Only show to customer after booking is accepted
  if (!isCustomer || !isAccepted) {
    return null;
  }

  const handleGeneratePin = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await post('/api/ttlock-create-pin', {
        transactionId: transaction.id.uuid,
      });

      if (!data.success) {
        throw new Error('Failed to generate access code');
      }

      setPin(data.pin);
      setPinGenerated(true);
    } catch (err) {
      console.error('Error generating PIN:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // If PIN already exists in metadata, show it
  if (ttlockData && ttlockData.lockId) {
    return (
      <div className={classNames(className, css.root)}>
        <div className={css.header}>
          <IconKeys className={css.icon} />
          <h3 className={css.title}>
            <FormattedMessage id="AccessCodePanel.title" />
          </h3>
        </div>
        <div className={css.content}>
          <p className={css.info}>
            <FormattedMessage id="AccessCodePanel.alreadyGenerated" />
          </p>
          <div className={css.note}>
            <FormattedMessage id="AccessCodePanel.contactHost" />
          </div>
        </div>
      </div>
    );
  }

  // If PIN was just generated, show it
  if (pinGenerated && pin) {
    return (
      <div className={classNames(className, css.root)}>
        <div className={css.header}>
          <IconKeys className={css.icon} />
          <h3 className={css.title}>
            <FormattedMessage id="AccessCodePanel.title" />
          </h3>
        </div>
        <div className={css.content}>
          <div className={css.pinDisplay}>
            <span className={css.pinLabel}>
              <FormattedMessage id="AccessCodePanel.yourCode" />
            </span>
            <span className={css.pinCode}>{pin}</span>
          </div>
          <p className={css.info}>
            <FormattedMessage id="AccessCodePanel.saveCode" />
          </p>
        </div>
      </div>
    );
  }

  // Show button to generate PIN
  return (
    <div className={classNames(className, css.root)}>
      <div className={css.header}>
        <IconKeys className={css.icon} />
        <h3 className={css.title}>
          <FormattedMessage id="AccessCodePanel.title" />
        </h3>
      </div>
      <div className={css.content}>
        <p className={css.info}>
          <FormattedMessage id="AccessCodePanel.description" />
        </p>
        <button
          className={css.button}
          onClick={handleGeneratePin}
          disabled={loading}
        >
          {loading ? (
            <FormattedMessage id="AccessCodePanel.generating" />
          ) : (
            <FormattedMessage id="AccessCodePanel.generateButton" />
          )}
        </button>
        {error && (
          <div className={css.error}>
            <FormattedMessage id="AccessCodePanel.error" values={{ error }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessCodePanel;
