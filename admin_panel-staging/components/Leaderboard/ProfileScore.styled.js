import styled from 'styled-components';

export const ProfileScoreStyle = styled.div`
.profile-score-container {
    width: 100%;
    height: 100%;
    top: 450px;
    left: 93px;
    display: flex;
    flex-direction: column;
    items-align: center;
    align-items: center;
}
.profile-score-inner-container {
    width: 80%;
    height: 409px;
    top: 492px;
    left: 228px;
    display: flex;
    flex-direction: row;
    items-align: center;
    gap:4px;
    align-items: center;
}

.profile-score-total-score {
    display: flex;
    width: 300px;
    padding: 12px 24px;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    align-self: stretch;
    background-color: #FFF;
    border: 1.433px solid var(--neutral-3, #E4EEF3);
    border-radius: 7px;
}

.profile-score-total-score-title {
    display: flex;
    height: 80px;
    // flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 12px;  
}

.profile-score-total-score-title h2 {
    color: #798C9A;
    font-family: Circular Std;
    font-size: 24px;
    font-style: normal;
    font-weight: 500;
    line-height: 28.655px;
}

.profile-score-total-score-number h2 {
    color:  #24282C;
    text-align: center;
    font-family: Circular Std;
    font-size: 64px;
    font-style: normal;
    font-weight: 500;
    line-height: 150%;
}

.profile-score-total-score-change {
    display: flex;
    height: 80px;
    justify-content: center;
    align-items: center;
    gap: 12px;
    align-self: stretch;
}

.profile-score-total-score-change h2 {
    color: var(--neutral-10, #2C3336);
    font-family: Circular Std;
    font-size: 22.924px;
    font-style: normal;
    font-weight: 450;
    line-height: 34.386px;
    margin:0px;
    
}

.profile-scores {
    display: flex;
    padding: 10px;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    flex: 1 0 0;
}

.profile-score-item {
    width: 100%;
    display: flex;
    padding: 12px 24px;
    justify-content: space-between;
    align-items: center;
    border-radius: 9px;
    border: 1.762px solid var(--neutral-3, #E4EEF3);
    background: var(--neutral-1, #FFF);
}

.profile-score-title {
    margin: 0px;
    color: #798C9A;
    font-family: Circular Std;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    line-height: 35.238px;
    text-transform: capitalize;
}

.profile-scores-numbers {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

/* .profile-scores-numbers > * {
    width: 100%;
} */

.profile-scores-numbers h2 {
    margin:0px;
}

.profile-score-number {
    color: #24282C;
    font-family: Circular Std;
    font-size: 36px;
    font-style: normal;
    font-weight: 500;
    line-height: 42.286px;
    width: 150px;
}
`;

function getBackground(score) {
    if (score > 0) {
        return 'var(--polar-green-2, #D9F7BE)';
    } else if (score == 0) {
        return '#E4EEF3';
    } else {
        return 'var(--volcano-2, #FFD8BF)';
    }
}

function getTextColor(score) {
    if (score > 0) {
        return 'var(--polar-green-7, #389E0D)';
    } else if (score == 0) {
        return '#798C9A';
    } else {
        return 'var(--dust-red-7, #CF1322)';
    }
}

export const ScoreArrowStyle = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    width: 100px;
    overflow: hidden;

.profile-score-total-score-change-arrow {
    display: flex;
    width: 31.52px;
    height: 31.52px;
    padding: 4.298px;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 14.327px;
    border-radius: 3px;
    background: ${props => getBackground(props.score)};
}

.profile-score-change {
    color: ${props => getTextColor(props.score)};
    font-family: Circular Std;
    font-size: 20px;
    font-style: normal;
    font-weight: 450;
    line-height: 42.286px;
}
`;

