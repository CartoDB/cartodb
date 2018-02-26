import React from 'react'; // eslint-disable-line
const ReactView = require('dashboard/helpers/react-view');

const Like = (props) => {
  const {
    size,
    likes,
    show_label,
    show_count,
    onClick
  } = props;

  const extraClass = size === 'big' ? 'LikesIndicator-icon--big Navmenu-icon' : null;

  return (
    <div onClick={onClick}>
      <div>
        <i className={`CDB-IconFont CDB-IconFont-heartFill LikesIndicator-icon ${extraClass}`} />
      </div>
      { likes > 2 || show_count ? <span className="CDB-Text CDB-Size-medium LikesIndicator-count">{likes}</span> : null }
      { show_label && likes > 1 ? <span className="CDB-Text CDB-Size-medium LikesIndicator-label">likes</span> : null }
    </div>
  );
};

module.exports = ReactView.extend({
  component: Like
});
