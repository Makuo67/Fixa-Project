import styled from 'styled-components';
import PropTypes from 'prop-types';

import Logo from '../../../assets/images/logo-strapi.png';

const Wrapper = styled.div`
  background-color: #14B7BC;
  padding-left: 0;
  height: ${props => props.theme.main.sizes.leftMenu.height};

  .leftMenuHeaderLink {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 6rem;
    padding: 0;
    &:hover {
      text-decoration: none;
    }
  }

  .projectName {
    display: block;
    width: auto;
    height: auto;
    font-size: 2rem;
    letter-spacing: 0.2rem;
    color: #ffffff;

    
    background-repeat: no-repeat;
    background-position: left center;
    background-size: auto 2.5rem;
  }
`;
//background-image: url(${Logo});

Wrapper.defaultProps = {
  theme: {
    main: {
      colors: {
        leftMenu: {},
      },
      sizes: {
        header: {},
        leftMenu: {},
      },
    },
  },
};

Wrapper.propTypes = {
  theme: PropTypes.object,
};

export default Wrapper;
