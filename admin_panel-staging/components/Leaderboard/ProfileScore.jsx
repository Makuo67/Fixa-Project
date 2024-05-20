import { useState, useEffect } from 'react';
import { Skeleton, Tooltip } from 'antd';
import { Icon } from '@iconify/react';

import { ProfileScoreStyle, ScoreArrowStyle } from "./ProfileScore.styled";
import { ArrowDown, ArrowUp, Neutral } from "./ScoreDisplay";
import { getWorkerLeaderboardScore } from '../../helpers/workforce/leaderboard';

/* ======= Loading component ====== */
const LeaderboardLoader = () => (

    <div className="profile-score-container">

        <div className="profile-score-inner-container">
            <div>
                <Skeleton.Button active={true} style={{
                    width: '283px',
                    height: '400px',
                    borderRadius: '5px'
                }} />
            </div>

            {/* ===== Score breakdown ==== */}
            <div className="profile-scores">
                {[1, 2, 3, 4, 5].map((item) => (

                    <div key={item}>
                        <Skeleton.Button active={true} style={{
                            width: '500px',
                            height: '70px',
                            borderRadius: '5px'
                        }} />
                    </div>
                ))}
            </div>
        </div>
    </div>
)

/* ======= ERROR component ====== */
const LeaderboardError = () => (
    <div className="profile-score-container">
        <div className="profile-score-inner-container">
            <div className="profile-score-total-score-number">
                <h2>No Scores yet!</h2>
            </div>
        </div>
    </div>
)

const ProfileScore = ({ worker_id }) => {
    const [leaderBoardScores, setLeaderBoardScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLeaderBoardScores = async (id) => {
            getWorkerLeaderboardScore(id).then((res) => {
                setLeaderBoardScores(res.result);
                setLoading(false)
                if (res.result.length === 0) {
                    setError(true)
                }

            }).catch((err) => {
                setLoading(false)
                setError(true)
                console.log(err);

            });
        }
        fetchLeaderBoardScores(worker_id);
    }, []);

    // console.log("leaderBoardScores", leaderBoardScores, "loading", loading, "error:", error, "worker id", worker_id)
    if (loading) (
        <LeaderboardLoader />
    )
    if (error) (
        <LeaderboardError />
    )
    return (
        <ProfileScoreStyle>

            <div className="profile-score-container">
                <div className="profile-score-inner-container">
                    {loading ? (
                        <LeaderboardLoader />
                    ) : error ? (
                        <LeaderboardError />

                    ) : (
                        <>
                            <div className="profile-score-total-score">
                                <div className="profile-score-total-score-title">
                                    {/* Total score */}
                                    <h2>Total Score</h2>
                                    {/* flag */}
                                    {leaderBoardScores?.flagged && (
                                        <Tooltip title={`${leaderBoardScores?.flag_reason}`}>
                                            <Icon icon="ion:flag-sharp" className='text-bder-red w-10 h-10' />
                                        </Tooltip>
                                    )}
                                </div>
                                <div className="w-full profile-score-total-score-number">
                                    <h2>{leaderBoardScores && leaderBoardScores.total_score ? leaderBoardScores.total_score : "-"}</h2>
                                </div>
                                <div className="profile-score-total-score-change">
                                    <ScoreArrowStyle score={leaderBoardScores.total_score_difference}>
                                        <div className="profile-score-total-score-change-arrow">
                                            {leaderBoardScores && leaderBoardScores.total_score_difference > 0 ? <ArrowUp /> : leaderBoardScores && leaderBoardScores.total_score_difference < 0 ? <ArrowDown /> : <Neutral />}
                                        </div>
                                        <h2>{leaderBoardScores && leaderBoardScores.total_score ? `${leaderBoardScores.total_score_difference}%` : "-"}</h2>
                                    </ScoreArrowStyle>
                                </div>
                            </div>

                            {/* ===== Score breakdown ==== */}
                            <div className="profile-scores">
                                {leaderBoardScores && leaderBoardScores.scores && leaderBoardScores.scores.map((item, index) => (
                                    <div className="profile-score-item" key={index}>
                                        <h2 className="profile-score-title">{item.score_name}</h2>
                                        <div className="profile-scores-numbers">
                                            <h2 className="profile-score-number">{item && item.score ? item.score : "-"}</h2>
                                            <ScoreArrowStyle score={item.score_difference}>
                                                <div className="profile-score-total-score-change-arrow ">
                                                    {item && item.score_difference > 0 ? <ArrowUp /> : item && item.score_difference < 0 ? <ArrowDown /> : <Neutral />}
                                                </div>

                                                <h2 className="profile-score-change">{item && item.score_difference ? `${item.score_difference}%` : "0%"}
                                                </h2>
                                            </ScoreArrowStyle>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>

        </ProfileScoreStyle>
    )
}

export default ProfileScore;