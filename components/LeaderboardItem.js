import React, { useContext, useEffect, useState } from "react";
import ReactPlayer from "react-player";
import styled from "styled-components";
import mixpanel from "mixpanel-browser";
import Link from "next/link";
import useKeyPress from "../hooks/useKeyPress";
import { getImageUrl, truncateWithEllipses } from "../lib/utilities";
import ModalTokenDetail from "./ModalTokenDetail";
import AppContext from "../context/app-context";

const LeaderboardItemRow = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding-top: 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.11);
    @media screen and (max-width: 1230px) {
        flex-direction: column;
        align-items: flex-start;
    }    
`;

const ProfileSection = styled.div`
    display: flex;
    flex-direction: row;
`;

const ProfileSectionContent = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 300px;
    @media screen and (max-width: 600px) {
        justify-content: space-around;
    }
`;

const ProfileBottomSection = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const ProfileTitle = styled.h4`
    font-size: 20px;
    font-weight: 500;
    cursor: pointer;
    &:hover {
        color: #e45cff;
    }
`;

const Metadata = styled.div`
    display: flex;
    @media screen and (max-width: 600px) {
        margin-left: -16px;
    }
`;

const MetadataIcon = styled.img`
    width: 16px;
    height: 16px;
    margin-left: 16px;
    margin-right: 8px;
`;

const MetadataText = styled.h6`
    font-size: 13px;
    font-weight: 500;
`;

const ProfileImage = styled.img`
    width: 72px;
    height: 72px;
    border-radius: 50%;
    margin-right: 20px;
    border: 2px solid #DFDFDF;
    box-sizing: border-box;
    margin-left: ${(p) => (p.isMobile ? "12px" : "0px")};
`;

const NFTTiles = styled.div`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    @media screen and (max-width: 1230px) {
        margin-top: 20px;
    }
`;

const NFTTile = styled.img`
    width: 90px;
    height: 90px;
    margin-left: 12px;
    margin-bottom: 20px;
    object-fit: cover;
    cursor: pointer;
`;

const NFTVideoTile = styled.div`
    width: 90px;
    height: 90px;
    margin-left: 12px;
    margin-bottom: 20px;
    cursor: pointer;
    background: black;
`;

const GraySeparator = styled.div`
    width: .125rem;
    margin-left: 16px;
    height: 30px;
    background: rgba(0, 0, 0, 0.11);
    @media screen and (max-width: 600px) {
        display: none;
    }
`;

const FollowButton = styled.button`
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 24px;
    border: 1px solid rgba(0, 0, 0, 0.11);
    box-sizing: border-box;
    border-radius: 41px;
    padding: 8px 16px;
    &:hover {
        opacity: 0.7;
    }
    @media screen and (max-width: 600px) {
        display: none;
    }
`;

const PlusIcon = styled.img`
    width: 16px;
    height: 16px;
    margin-right: 12px;
`;

const FollowText = styled.h6`
    font-size: 13px;
    font-weight: 400;
`;


const LeaderboardItem = ({ item }) => {
    const context = useContext(AppContext);
    const topItems = context.isMobile ? item?.top_items.slice(0, 6) : item?.top_items.slice(0, 7);
    const [isFollowed, setIsFollowed] = useState(false);
    const myFollows = context?.myFollows || [];
    const isMyProfile = context?.myProfile?.profile_id === item?.profile_id;
    useEffect(() => {
        var it_is_followed = false;
        _.forEach(myFollows, (follow) => {
            if (follow?.profile_id === item?.profile_id) {
                it_is_followed = true;
            }
        });
        setIsFollowed(it_is_followed);
    }, [myFollows]);
    const handleFollow = async () => {
        setIsFollowed(true);
        // Change myFollows via setMyFollows
        context.setMyFollows([{ profile_id: item?.profile_id }, ...context.myFollows]);
        // Post changes to the API
        await fetch(`/api/follow_v2/${item?.profile_id}`, {
            method: "post",
        });
        mixpanel.track("Followed profile");
    };
    const handleUnfollow = async () => {
        setIsFollowed(false);
        // Change myLikes via setMyLikes
        context.setMyFollows(
            context.myFollows.filter((i) => i?.profile_id !== item?.profile_id)
        );
        // Post changes to the API
        await fetch(`/api/unfollow_v2/${item?.profile_id}`, {
            method: "post",
        });
        mixpanel.track("Unfollowed profile");
    };
    const handleLoggedOutFollow = () => {
        mixpanel.track("Follow but logged out");
        context.setLoginModalOpen(true);
    };
    const [currentlyOpenModal, setCurrentlyOpenModal] = useState(null);
    const currentIndex = topItems?.findIndex(
        (i) => i.nft_id === currentlyOpenModal?.nft_id
    );
    const goToNext = () => {
        if (currentIndex < topItems.length - 1) {
            setCurrentlyOpenModal(topItems[currentIndex + 1]);
        }
    };
    const goToPrevious = () => {
        if (currentIndex - 1 >= 0) {
            setCurrentlyOpenModal(topItems[currentIndex - 1]);
        }
    };
    const leftPress = useKeyPress("ArrowLeft");
    const rightPress = useKeyPress("ArrowRight");
    const escPress = useKeyPress("Escape");
    useEffect(() => {
        if (escPress) {
            setCurrentlyOpenModal(null);
        }
        if (rightPress && currentlyOpenModal) {
            mixpanel.track("Next NFT - keyboard");
            goToNext();
        }
        if (leftPress && currentlyOpenModal) {
            mixpanel.track("Prior NFT - keyboard");
            goToPrevious();
        }
    }, [escPress, leftPress, rightPress]);

    const handleLike = async (nft_id) => {
        // Change myLikes via setMyLikes
        context.setMyLikes([...context.myLikes, nft_id]);

        const likedItem = topItems.find((i) => i.nft_id === nft_id);
        const myLikeCounts = context.myLikeCounts;
        context.setMyLikeCounts({
            ...context.myLikeCounts,
            [nft_id]:
                ((myLikeCounts && myLikeCounts[nft_id]) || likedItem.like_count) + 1,
        });

        // Post changes to the API
        await fetch(`/api/like_v3/${nft_id}`, {
            method: "post",
        });

        mixpanel.track("Liked item");
    };
    const handleUnlike = async (nft_id) => {
        // Change myLikes via setMyLikes
        context.setMyLikes(context.myLikes.filter((item) => !(item === nft_id)));

        const likedItem = topItems.find((i) => i.nft_id === nft_id);
        const myLikeCounts = context.myLikeCounts;
        context.setMyLikeCounts({
            ...context.myLikeCounts,
            [nft_id]:
                ((myLikeCounts && myLikeCounts[nft_id]) || likedItem.like_count) - 1,
        });

        // Post changes to the API
        await fetch(`/api/unlike_v3/${nft_id}`, {
            method: "post",
        });

        mixpanel.track("Unliked item");
    };

    return (
        <>
            {typeof document !== "undefined" ? (
                <>
                    <ModalTokenDetail
                        isOpen={currentlyOpenModal}
                        setEditModalOpen={setCurrentlyOpenModal}
                        item={currentlyOpenModal}
                        handleLike={handleLike}
                        handleUnlike={handleUnlike}
                        goToNext={goToNext}
                        goToPrevious={goToPrevious}
                        columns={context.columns}
                        hasNext={!(currentIndex === topItems.length - 1)}
                        hasPrevious={!(currentIndex === 0)}
                    />
                </>
            ) : null}
            <LeaderboardItemRow>
                <ProfileSection>
                    <ProfileImage isMobile={context.isMobile} src={getImageUrl(item?.img_url)} />
                    <ProfileSectionContent>
                        <Link
                            href="/[profile]"
                            as={`/${item?.username || item.address}`}
                        >
                            <ProfileTitle>
                                {truncateWithEllipses(item?.name, 30) || "Unnamed"}
                            </ProfileTitle>
                        </Link>
                        <ProfileBottomSection>
                            {!isMyProfile &&
                                <>
                                    <FollowButton onClick={
                                        context.user
                                            ? isFollowed
                                                ? handleUnfollow
                                                : handleFollow
                                            : handleLoggedOutFollow
                                    }>
                                        {!isFollowed && <PlusIcon src="/icons/plus.svg" />}
                                        <FollowText>
                                            {isFollowed ? "Following" : "Follow"}
                                        </FollowText>
                                    </FollowButton>
                                    <GraySeparator />
                                </>}
                            <Metadata>
                                <MetadataIcon src="/icons/user.svg" />
                                <MetadataText>{item?.follower_count}</MetadataText>
                                <MetadataIcon src="/icons/heart.svg" />
                                <MetadataText>{item?.like_count_total}</MetadataText>
                            </Metadata>
                        </ProfileBottomSection>
                    </ProfileSectionContent>
                </ProfileSection>
                <NFTTiles>
                    {topItems.map((topItem, index) =>
                        <>
                            {topItem?.token_has_video
                                ? <NFTVideoTile
                                    key={index}
                                    onClick={() => setCurrentlyOpenModal(topItem)}
                                >
                                    <ReactPlayer
                                        url={topItem?.token_animation_url}
                                        playing={false}
                                        loop
                                        muted={true}
                                        width={90}
                                        height={90}
                                        playsinline
                                    />
                                </NFTVideoTile>
                                : <NFTTile
                                    key={index}
                                    onClick={() => setCurrentlyOpenModal(topItem)}
                                    src={getImageUrl(topItem?.token_img_url)}
                                />
                            }
                        </>)}
                </NFTTiles>
            </LeaderboardItemRow>
        </>
    );
}

export default LeaderboardItem
