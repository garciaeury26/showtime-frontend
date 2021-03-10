import { useState, useEffect, useContext } from "react";
import Head from "next/head";
import _ from "lodash";
import mixpanel from "mixpanel-browser";
import Layout from "../components/layout";
import TokenGridV4 from "../components/TokenGridV4";
import backend from "../lib/backend";
import AppContext from "../context/app-context";
import ShareButton from "../components/ShareButton";
import ModalEditProfile from "../components/ModalEditProfile";
import ModalEditPhoto from "../components/ModalEditPhoto";
import { GridTabs, GridTab } from "../components/GridTabs";
import ProfileInfoPill from "../components/ProfileInfoPill";
import ModalUserList from "../components/ModalUserList";
import ModalAddWallet from "../components/ModalAddWallet";

export async function getServerSideProps(context) {
  const { res, query } = context;

  const slug_address = query.profile;

  if (slug_address.includes("apple-touch-icon")) {
    res.writeHead(404);
    res.end();
    return { props: {} };
  }

  // Get profile metadata
  let response_profile;
  try {
    response_profile = await backend.get(`/v2/profile_server/${slug_address}`);

    const data_profile = response_profile.data.data;
    const name = data_profile.profile.name;
    const img_url = data_profile.profile.img_url;
    const wallet_addresses = data_profile.profile.wallet_addresses;
    const wallet_addresses_excluding_email =
      data_profile.profile.wallet_addresses_excluding_email;
    const followers_list = data_profile.followers;
    const following_list = data_profile.following;

    const bio = data_profile.profile.bio;
    const website_url = data_profile.profile.website_url;
    const profile_id = data_profile.profile.profile_id;
    const username = data_profile.profile.username;

    return {
      props: {
        name,
        img_url,
        wallet_addresses,
        wallet_addresses_excluding_email,
        slug_address,
        followers_list,
        following_list,
        bio,
        website_url,
        profile_id,
        username,
      }, // will be passed to the page component as props
    };
  } catch (err) {
    if (err.response.status == 400) {
      // Redirect to homepage
      res.writeHead(302, { location: "/" });
      res.end();
      return { props: {} };
    } else {
      res.writeHead(404);
      res.end();
      return { props: {} };
    }
  }
}

const Profile = ({
  name,
  img_url,
  wallet_addresses,
  wallet_addresses_excluding_email,
  slug_address,
  followers_list,
  following_list,
  bio,
  website_url,
  profile_id,
  username,
}) => {
  //const router = useRouter();
  const context = useContext(AppContext);
  const { columns, gridWidth } = context;

  const [isMyProfile, setIsMyProfile] = useState();
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    const checkIfFollowed = async () => {
      var it_is_followed = false;
      await _.forEach(context.myFollows, (follow) => {
        if (wallet_addresses.includes(follow.wallet_address)) {
          it_is_followed = true;
        }
      });
      setIsFollowed(it_is_followed);
    };

    checkIfFollowed();
  }, [context.myFollows, wallet_addresses]);

  const [createdItems, setCreatedItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [likedItems, setLikedItems] = useState([]);

  const [createdHiddenItems, setCreatedHiddenItems] = useState([]);
  const [ownedHiddenItems, setOwnedHiddenItems] = useState([]);
  const [likedHiddenItems, setLikedHiddenItems] = useState([]);

  const [isLoadingCards, setIsLoadingCards] = useState(false);

  // Fetch the created/owned/liked items
  useEffect(() => {
    const fetchItems = async () => {
      // clear out existing from page (if switching profiles)
      setIsLoadingCards(true);

      setCreatedItems([]);
      setOwnedItems([]);
      setLikedItems([]);

      setCreatedHiddenItems([]);
      setOwnedHiddenItems([]);
      setLikedHiddenItems([]);

      const response_profile = await backend.get(
        `/v2/profile_client/${slug_address}?limit=150`
      );
      const data_profile = response_profile.data.data;

      setCreatedHiddenItems(data_profile.created_hidden);
      setOwnedHiddenItems(data_profile.owned_hidden);
      setLikedHiddenItems(data_profile.liked_hidden);

      setCreatedItems(
        data_profile.created.filter(
          (item) =>
            item.token_hidden !== 1 &&
            (item.token_img_url || item.token_animation_url)
          //&& !data_profile.created_hidden.includes(item.nft_id)
        )
      );
      setOwnedItems(
        data_profile.owned.filter(
          (item) =>
            item.token_hidden !== 1 &&
            (item.token_img_url || item.token_animation_url)
          //&& !data_profile.owned_hidden.includes(item.nft_id)
        )
      );
      setLikedItems(
        data_profile.liked.filter(
          (item) =>
            item.token_hidden !== 1 &&
            (item.token_img_url || item.token_animation_url)
          //&& !data_profile.liked_hidden.includes(item.nft_id)
        )
      );
      setIsLoadingCards(false);
    };
    fetchItems();
  }, [wallet_addresses]);

  const [followers, setFollowers] = useState([]);
  useEffect(() => {
    setFollowers(followers_list);
  }, [followers_list]);

  const [following, setFollowing] = useState([]);
  useEffect(() => {
    setFollowing(following_list);
  }, [following_list]);

  useEffect(() => {
    // Wait for identity to resolve before recording the view
    if (typeof context.user !== "undefined") {
      if (context.user) {
        // Logged in?
        if (
          context.myProfile?.wallet_addresses
            .map((a) => a.toLowerCase())
            .includes(slug_address.toLowerCase()) ||
          slug_address.toLowerCase() ===
            context.myProfile?.username?.toLowerCase()
        ) {
          setIsMyProfile(true);
          mixpanel.track("Self profile view", { slug: slug_address });
        } else {
          setIsMyProfile(false);
          mixpanel.track("Profile view", { slug: slug_address });
        }
      } else {
        // Logged out
        setIsMyProfile(false);
        mixpanel.track("Profile view", { slug: slug_address });
      }
    }
  }, [
    wallet_addresses,
    typeof context.user,
    context.myProfile,
    context.user ? context.user.publicAddress : null,
  ]);

  const handleLoggedOutFollow = () => {
    mixpanel.track("Follow but logged out");
    context.setLoginModalOpen(true);
  };

  const handleFollow = async () => {
    setIsFollowed(true);
    // Change myFollows via setMyFollows
    context.setMyFollows([
      {
        profile_id: profile_id,
        wallet_address: wallet_addresses[0],
        name: name,
        img_url: img_url
          ? img_url
          : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png",
        timestamp: null,
        username: username,
      },
      ...context.myFollows,
    ]);

    setFollowers([
      {
        profile_id: context.myProfile.profile_id,
        wallet_address: context.user.publicAddress,
        name: context.myProfile.name,
        img_url: context.myProfile.img_url
          ? context.myProfile.img_url
          : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png",
        timestamp: null,
        username: context.myProfile.username,
      },
      ...followers,
    ]);

    // Post changes to the API
    await fetch(`/api/follow_v2/${profile_id}`, {
      method: "post",
    });

    mixpanel.track("Followed profile");
  };

  const handleUnfollow = async () => {
    setIsFollowed(false);
    // Change myLikes via setMyLikes
    context.setMyFollows(
      context.myFollows.filter((item) => item.profile_id != profile_id)
    );

    setFollowers(
      followers.filter((follower) => {
        return context.myProfile.profile_id != follower.profile_id;
      })
    );

    // Post changes to the API
    await fetch(`/api/unfollow_v2/${profile_id}`, {
      method: "post",
    });

    mixpanel.track("Unfollowed profile");
  };

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [pictureModalOpen, setPictureModalOpen] = useState(false);

  const [selectedGrid, setSelectedGrid] = useState("created");

  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const [openCardMenu, setOpenCardMenu] = useState(null);
  const [showUserHiddenItems, setShowUserHiddenItems] = useState(false);

  useEffect(() => {
    // Pick an initial tab to display
    if (isLoadingCards) {
      setSelectedGrid("created");
    } else {
      if (createdItems.length > 0 && createdItems.length > ownedItems.length) {
        setSelectedGrid("created");
      } else if (ownedItems.length > 0) {
        setSelectedGrid("owned");
      } else {
        setSelectedGrid("liked");
      }
    }

    setShowFollowers(false);
    setShowFollowing(false);
  }, [
    wallet_addresses,
    createdItems.length,
    ownedItems.length,
    isLoadingCards,
  ]);

  // profilePill Edit profile actions
  const editAccount = () => {
    setEditModalOpen(true);
    mixpanel.track("Open edit name");
  };

  const editPhoto = () => {
    setPictureModalOpen(true);
    mixpanel.track("Open edit photo");
  };

  const addWallet = () => {
    setWalletModalOpen(true);
    mixpanel.track("Open add wallet");
  };

  const logout = async () => {
    await context.logOut();
    setIsMyProfile(false);
  };

  const FilterTabs = (
    <GridTabs>
      <GridTab
        label="Created"
        itemCount={
          isLoadingCards
            ? null
            : showUserHiddenItems
            ? createdItems.length
            : createdItems.length == 150 // go ahead and say 150+ if we are at max items
            ? 150
            : createdItems.filter(
                (item) => !createdHiddenItems.includes(item.nft_id)
              ).length
        }
        isActive={selectedGrid === "created"}
        onClickTab={() => {
          setSelectedGrid("created");
        }}
      />
      <GridTab
        label="Owned"
        itemCount={
          isLoadingCards
            ? null
            : showUserHiddenItems
            ? ownedItems.length
            : ownedItems.length == 150 // go ahead and say 150+ if we are at max items
            ? 150
            : ownedItems.filter(
                (item) => !ownedHiddenItems.includes(item.nft_id)
              ).length
        }
        isActive={selectedGrid === "owned"}
        onClickTab={() => {
          setSelectedGrid("owned");
        }}
      />
      <GridTab
        label="Liked"
        itemCount={
          isLoadingCards
            ? null
            : showUserHiddenItems
            ? likedItems.length
            : likedItems.length == 150 // go ahead and say 150+ if we are at max items
            ? 150
            : likedItems.filter(
                (item) => !likedHiddenItems.includes(item.nft_id)
              ).length
        }
        isActive={selectedGrid === "liked"}
        onClickTab={() => {
          setSelectedGrid("liked");
        }}
      />
    </GridTabs>
  );

  return (
    <div
      onClick={() => {
        setOpenCardMenu(null);
      }}
    >
      <Layout>
        <Head>
          <title>
            Profile |{" "}
            {isMyProfile
              ? context.myProfile
                ? context.myProfile.name
                  ? context.myProfile.name
                  : "Unnamed"
                : name
                ? name
                : "Unnamed"
              : name
              ? name
              : "Unnamed"}
          </title>

          <meta
            name="description"
            content="Explore digital art I've created, owned, and liked"
          />
          <meta property="og:type" content="website" />
          <meta
            name="og:description"
            content="Explore digital art I've created, owned, and liked"
          />
          <meta
            property="og:image"
            content={
              img_url
                ? img_url
                : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
            }
          />
          <meta name="og:title" content={name ? name : wallet_addresses[0]} />

          <meta name="twitter:card" content="summary" />
          <meta
            name="twitter:title"
            content={name ? name : wallet_addresses[0]}
          />
          <meta
            name="twitter:description"
            content="Explore digital art I've created, owned, and liked"
          />
          <meta
            name="twitter:image"
            content={
              img_url
                ? img_url
                : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
            }
          />
        </Head>

        {typeof document !== "undefined" ? (
          <>
            <ModalAddWallet
              isOpen={walletModalOpen}
              setWalletModalOpen={setWalletModalOpen}
              walletAddresses={wallet_addresses}
            />
            <ModalEditProfile
              isOpen={editModalOpen}
              setEditModalOpen={setEditModalOpen}
            />
            <ModalEditPhoto
              isOpen={pictureModalOpen}
              setEditModalOpen={setPictureModalOpen}
            />
            {/* Followers modal */}
            <ModalUserList
              title="Followers"
              isOpen={showFollowers}
              users={followers ? followers : []}
              closeModal={() => {
                setShowFollowers(false);
              }}
              emptyMessage="No followers yet."
            />
            {/* Following modal */}
            <ModalUserList
              title="Following"
              isOpen={showFollowing}
              users={following ? following : []}
              closeModal={() => {
                setShowFollowing(false);
              }}
              emptyMessage="Not following anyone yet."
            />
          </>
        ) : null}

        {/* Start Page Body */}
        {/* Wait until @gridWidth is populated to display page's body */}

        {gridWidth && (
          <div className="m-auto" style={{ width: gridWidth }}>
            <div
              style={
                context.columns == 1
                  ? { marginLeft: 16, marginRight: 16 }
                  : { marginLeft: 12, marginRight: 12 }
              }
            >
              <div
                className="float-right mt-16 text-right"
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: "#999",
                }}
              >
                {columns > 2
                  ? wallet_addresses_excluding_email.map((address) => {
                      return <div key={address}>{address}</div>;
                    })
                  : null}
              </div>
              <div className="flex flex-row items-center text-center mx-0 px-0  pt-10">
                <div className="flex-grow sm:hidden"></div>
                <div
                  className="showtime-title text-center mx-auto text-2xl md:text-5xl md:leading-snug mt-5"
                  style={{ fontWeight: 600, wordBreak: "break-word" }}
                >
                  {isMyProfile
                    ? context.myProfile
                      ? context.myProfile.name
                        ? context.myProfile.name
                        : "Unnamed"
                      : name
                      ? name
                      : "Unnamed"
                    : name
                    ? name
                    : "Unnamed"}
                </div>
                <div className="ml-1 sm:ml-2 mt-4 sm:mt-8">
                  <ShareButton
                    url={
                      typeof window !== "undefined"
                        ? window.location.href
                        : null
                    }
                    type={"profile"}
                  />
                </div>
                <div className="flex-grow"></div>
              </div>
              <div
                className={`${
                  isMyProfile && context.myProfile
                    ? !context.myProfile.bio && !context.myProfile.website_url
                      ? "hidden"
                      : "flex-1"
                    : !bio && !website_url
                    ? "hidden"
                    : "flex-1"
                } mt-4 text-base align-center flex flex-col justify-center items-center md:items-start`}
              >
                {/*<h4 className="text-black mb-2 text-lg font-semibold">About</h4>*/}
                {isMyProfile && context.myProfile ? (
                  context.myProfile.bio ? (
                    <div className="pb-2 sm:mr-16 max-w-xl">
                      <div className="text-center md:text-left">
                        {context.myProfile.bio}
                      </div>
                    </div>
                  ) : null
                ) : bio ? (
                  <div className="pb-2 sm:mr-16 max-w-xl">
                    <div className="text-center md:text-left">
                      <div className="">{bio}</div>
                    </div>
                  </div>
                ) : null}

                {isMyProfile && context.myProfile ? (
                  context.myProfile.website_url ? (
                    <div className="w-min">
                      <a
                        href={
                          context.myProfile.website_url.slice(0, 4) === "http"
                            ? context.myProfile.website_url
                            : "https://" + context.myProfile.website_url
                        }
                        target="_blank"
                        className="flex flex-row items-center justify-center"
                        style={{ color: "rgb(81, 125, 228)" }}
                        onClick={() => {
                          mixpanel.track("Clicked profile website link", {
                            slug: slug_address,
                          });
                        }}
                      >
                        <div>{context.myProfile.website_url}</div>
                      </a>
                    </div>
                  ) : null
                ) : website_url ? (
                  <div className="w-min">
                    <a
                      href={
                        website_url.slice(0, 4) === "http"
                          ? website_url
                          : "https://" + website_url
                      }
                      target="_blank"
                      className="flex flex-row"
                      style={{ color: "rgb(81, 125, 228)" }}
                      onClick={() => {
                        mixpanel.track("Clicked profile website link", {
                          slug: slug_address,
                        });
                      }}
                    >
                      <div style={{ wordWrap: "break-word" }}>
                        {website_url}
                      </div>
                    </a>
                  </div>
                ) : null}
              </div>

              <ProfileInfoPill
                isFollowed={isFollowed}
                isMyProfile={isMyProfile}
                onClickFollow={
                  context.user
                    ? isFollowed
                      ? handleUnfollow
                      : handleFollow
                    : handleLoggedOutFollow
                }
                onClickPhoto={() => {
                  setPictureModalOpen(true);
                  mixpanel.track("Open edit photo");
                }}
                numFollowers={followers && followers.length}
                numFollowing={following && following.length}
                showFollowers={() => {
                  setShowFollowers(true);
                }}
                showFollowing={() => {
                  setShowFollowing(true);
                }}
                profileImageUrl={
                  isMyProfile
                    ? context.myProfile && context.myProfile.img_url
                      ? context.myProfile.img_url
                      : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                    : img_url
                    ? img_url
                    : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                }
                profileActions={{ editAccount, editPhoto, addWallet, logout }}
              />
            </div>
            <div className="mx-auto" style={{ width: gridWidth }}>
              {FilterTabs}
              {isMyProfile ? (
                <div className="flex">
                  <div className="flex-grow"></div>
                  <div
                    className="text-right pr-3 text-sm hidden-items-link pb-1"
                    onClick={() => {
                      setShowUserHiddenItems(!showUserHiddenItems);
                    }}
                    style={
                      context.windowSize && context.windowSize.width < 600
                        ? {
                            fontWeight: 400,
                            fontSize: 12,
                            marginTop: -10,
                            marginBottom: 4,
                          }
                        : {
                            fontWeight: 400,
                            fontSize: 12,
                            marginTop: -59,
                          }
                    }
                  >
                    {createdHiddenItems.length === 0 &&
                    ownedHiddenItems.length === 0 &&
                    likedHiddenItems.length === 0
                      ? null
                      : showUserHiddenItems
                      ? "Hide hidden items"
                      : "Show hidden items"}
                  </div>
                </div>
              ) : null}
            </div>

            <TokenGridV4
              items={
                selectedGrid === "created"
                  ? createdItems
                  : selectedGrid === "owned"
                  ? ownedItems
                  : selectedGrid === "liked"
                  ? likedItems
                  : null
              }
              isLoading={isLoadingCards}
              listId={
                selectedGrid === "created"
                  ? 1
                  : selectedGrid === "owned"
                  ? 2
                  : selectedGrid === "liked"
                  ? 3
                  : null
              }
              isMyProfile={isMyProfile}
              openCardMenu={openCardMenu}
              setOpenCardMenu={setOpenCardMenu}
              userHiddenItems={
                selectedGrid === "created"
                  ? createdHiddenItems
                  : selectedGrid === "owned"
                  ? ownedHiddenItems
                  : selectedGrid === "liked"
                  ? likedHiddenItems
                  : null
              }
              setUserHiddenItems={
                selectedGrid === "created"
                  ? setCreatedHiddenItems
                  : selectedGrid === "owned"
                  ? setOwnedHiddenItems
                  : selectedGrid === "liked"
                  ? setLikedHiddenItems
                  : null
              }
              showUserHiddenItems={showUserHiddenItems}
            />
          </div>
        )}
        {/* End Page Body */}
      </Layout>
    </div>
  );
};

export default Profile;