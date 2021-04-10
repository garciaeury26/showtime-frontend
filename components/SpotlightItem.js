import React from "react";
import Link from "next/link";
import _ from "lodash";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faPlay,
  faEllipsisH,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
//import { faSun } from "@fortawesome/free-regular-svg-icons";
//import { faEdit } from "@fortawesome/free-regular-svg-icons";
import LikeButton from "./LikeButton";
import CommentButton from "./CommentButton";
import ShareButton from "./ShareButton";
import ReactPlayer from "react-player";
import mixpanel from "mixpanel-browser";
import AppContext from "../context/app-context";
import { getBidLink, getContractName } from "../lib/utilities";
import ModalTokenDetail from "./ModalTokenDetail";

class SpotlightItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      spans: 1,
      moreShown: false,
      imageLoaded: false,
      muted: true,
      refreshing: false,
      currentlyOpenModal: false,
      currentlyPlayingVideo: true,
      videoReady: false,
    };
    this.divRef = React.createRef();
  }

  removeTags(str) {
    if (str === null || str === "") return false;
    else str = str.toString();
    return str.replace(/(<([^>]+)>)/gi, " ");
  }

  truncateWithEllipses(text, max) {
    if (text) {
      return text.substr(0, max - 1) + (text.length > max ? "..." : "");
    }
  }

  handleRefreshNFTMetadata = async () => {
    mixpanel.track("Clicked refresh metadata");
    this.setState({ refreshing: true });
    await fetch(`/api/refreshmetadata/${this.props.item.nft_id}`, {
      method: "post",
    });
    await this.props.refreshItems();
    this.setState({ refreshing: false });
  };

  handleRemoveFromSpotlight = async () => {};

  getImageUrl = () => {
    var img_url = this.props.item.token_img_url
      ? this.props.item.token_img_url
      : null;

    if (img_url && img_url.includes("https://lh3.googleusercontent.com")) {
      this.props.item.token_aspect_ratio &&
      Number(this.props.item.token_aspect_ratio) > this.aspect_ratio_cutoff
        ? (img_url = img_url.split("=")[0] + "=w2104")
        : (img_url = img_url.split("=")[0] + "=w1004");
    }
    return img_url;
  };

  max_description_length = 180;
  aspect_ratio_cutoff = 1.6;

  getBackgroundColor = (item) => {
    if (
      item.token_background_color &&
      item.token_background_color.length === 6
    ) {
      return `#${item.token_background_color}`;
    } else {
      return null;
    }
  };

  render() {
    const { item, isMyProfile, listId } = this.props;
    const hash = item.token_img_url || item.token_animation_url;
    const { isMobile, columns } = this.context;
    return (
      <>
        {typeof document !== "undefined" ? (
          <>
            <ModalTokenDetail
              isOpen={this.state.currentlyOpenModal}
              setEditModalOpen={(_) =>
                this.setState({ currentlyOpenModal: false })
              }
              item={this.props.item}
              // goToNext={goToNext}
              // goToPrevious={goToPrevious}
              // columns={context.columns}
              // hasNext={false}
              // hasPrevious={false}
            />
          </>
        ) : null}

        {isMyProfile ? (
          <div className="absolute top-7 right-6">
            <div
              onClick={(e) => {
                e.stopPropagation();

                this.props.setOpenCardMenu(
                  this.props.openCardMenu == item.nft_id + "_" + listId
                    ? null
                    : item.nft_id + "_" + listId
                );
              }}
              className="card-menu-button text-right flex items-center justify-center text-gray-400"
            >
              <FontAwesomeIcon
                style={{
                  height: 20,
                  width: 20,
                }}
                icon={faEllipsisH}
              />
            </div>
            {this.props.openCardMenu == item.nft_id + "_" + listId ? (
              <div className="flex justify-end relative z-10">
                <div
                  className={`absolute text-center top-2 bg-white shadow-lg py-2 px-2 rounded-xl transition-all text-md transform  ${
                    this.props.openCardMenu == item.nft_id + "_" + listId
                      ? "visible opacity-1 "
                      : "invisible opacity-0"
                  }`}
                  style={{ border: "1px solid #f0f0f0" }}
                >
                  <div
                    className="py-2 px-3 hover:text-stpink hover:bg-gray-50 rounded-lg cursor-pointer whitespace-nowrap"
                    onClick={this.props.removeSpotlightItem}
                  >
                    Remove Spotlight
                  </div>
                  <div
                    className="py-2 px-3 hover:text-stpink hover:bg-gray-50 rounded-lg cursor-pointer whitespace-nowrap"
                    onClick={this.handleRefreshNFTMetadata}
                  >
                    Refresh Metadata
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          ref={this.divRef}
          className={`w-full flex ${
            item.token_aspect_ratio &&
            Number(item.token_aspect_ratio) > this.aspect_ratio_cutoff
              ? "flex-col"
              : "flex-row"
          }  `}
        >
          {this.props.item.token_aspect_ratio &&
          Number(this.props.item.token_aspect_ratio) >
            this.aspect_ratio_cutoff ? (
            <div className="text-stpink px-6 py-6 border-b border-gray-200">
              <FontAwesomeIcon icon={faStar} /> Spotlight
            </div>
          ) : null}
          <div
            className={`flex-1 ${
              item.token_aspect_ratio &&
              Number(item.token_aspect_ratio) > this.aspect_ratio_cutoff
                ? "pb-6"
                : "mr-6  h-full"
            }  `}
          >
            <div>
              {item.token_has_video ? (
                <>
                  <div
                    className={`w-full h-full ${
                      this.state.videoReady ? "hidden" : null
                    }`}
                  >
                    <div className="w-full text-center flex items-center mt-24 justify-center">
                      <div className="loading-card-spinner" />
                    </div>
                  </div>
                  <div
                    className={`w-full h-full ${
                      this.state.videoReady ? null : "invisible"
                    }`}
                  >
                    <ReactPlayer
                      url={item.token_animation_url}
                      playing={this.state.currentlyPlayingVideo}
                      loop
                      controls
                      muted={this.state.muted}
                      className={`w-full h-full`}
                      width={this.divRef?.current?.width / 2}
                      height={this.divRef?.current?.height + 1}
                      //width={columns === 1 ? window.innerWidth : "100%"}
                      // height={
                      //   columns === 1
                      //     ? item.imageRef
                      //       ? item.imageRef.current
                      //         ? item.imageRef.current.height
                      //         : null
                      //       : null
                      //     : "100%"
                      // }
                      playsinline
                      onReady={() => this.setState({ videoReady: true })}
                    />
                  </div>
                </>
              ) : (
                <div style={{ position: "relative" }}>
                  <div
                    onClick={() => {
                      mixpanel.track("Open NFT modal");
                      this.setState({
                        currentlyOpenModal: true,
                        muted: true,
                        currentlyPlayingVideo: false,
                      });
                    }}
                    style={{ cursor: "pointer" }}
                    className="h-full"
                  >
                    {!this.state.imageLoaded ? (
                      <div
                        className="w-full text-center flex items-center justify-center"
                        style={
                          columns === 1
                            ? { height: window.innerWidth }
                            : { height: 373 }
                        }
                      >
                        <div className="loading-card-spinner" />
                      </div>
                    ) : null}
                    <div className="flex">
                      <img
                        className={`w-full
          
                        ${
                          item.token_aspect_ratio &&
                          Number(item.token_aspect_ratio) >
                            this.aspect_ratio_cutoff
                            ? null
                            : null //"rounded-tl-lg rounded-bl-lg"
                        }
                        
                        `}
                        ref={item.imageRef}
                        src={this.getImageUrl()}
                        alt={item.token_name}
                        onLoad={() => this.setState({ imageLoaded: true })}
                        style={{
                          ...(!this.state.imageLoaded
                            ? { display: "none" }
                            : {
                                backgroundColor: this.getBackgroundColor(item),
                              }),
                        }}
                      />
                    </div>
                  </div>
                  {item.token_has_video ? (
                    <div
                      className="p-4 playbutton"
                      style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        mixpanel.track("Play card video");
                        this.setState({
                          muted: false,
                          currentlyPlayingVideo: true,
                        });
                      }}
                    >
                      <FontAwesomeIcon
                        style={{
                          height: 20,
                          width: 20,
                          color: "white",
                          filter: "drop-shadow(0px 0px 10px grey)",
                        }}
                        icon={faPlay}
                      />
                    </div>
                  ) : null}
                  {this.state.refreshing && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#fffffff0",
                      }}
                    >
                      <div className="loading-card-spinner-small mb-2" />
                      <div>Refreshing...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div
            className={`flex-1  text-left pr-6
          
          ${
            item.token_aspect_ratio &&
            Number(item.token_aspect_ratio) > this.aspect_ratio_cutoff
              ? "pl-6"
              : "pt-6 "
          }
          
          `}
          >
            <div class="flex flex-col h-full">
              {this.props.item.token_aspect_ratio &&
              Number(this.props.item.token_aspect_ratio) >
                this.aspect_ratio_cutoff ? null : (
                <div className="text-stpink pb-6 mb-6 border-b border-gray-200">
                  <FontAwesomeIcon icon={faStar} /> Spotlight{" "}
                </div>
              )}

              <div className="flex flex-row">
                <div
                  onClick={() => {
                    mixpanel.track("Open NFT modal");
                    this.setState({
                      currentlyOpenModal: true,
                      muted: true,
                      currentlyPlayingVideo: false,
                    });
                  }}
                  className="mb-4 text-4xl hover:text-stpink"
                  style={{
                    overflowWrap: "break-word",
                    wordWrap: "break-word",

                    cursor: "pointer",
                  }}
                >
                  {item.token_name}
                </div>
                <div className="flex-grow"></div>
              </div>

              {item.token_description ? (
                <div
                  style={{
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                  }}
                  className="pb-2 pb-4 text-gray-500"
                >
                  <div>
                    {item.token_description?.length >
                      this.max_description_length && !this.state.moreShown ? (
                      <>
                        {this.truncateWithEllipses(
                          this.removeTags(item.token_description),
                          this.max_description_length
                        )}{" "}
                        <a
                          onClick={() => {
                            this.setState({ moreShown: true });
                          }}
                          className="text-gray-900 hover:text-gray-500 cursor-pointer"
                        >
                          {" "}
                          more
                        </a>
                      </>
                    ) : (
                      <div>{this.removeTags(item.token_description)}</div>
                    )}
                  </div>
                </div>
              ) : null}
              <div className="flex items-center">
                <div className="mr-2 text-base px-4 py-2 rounded-full shadow-md">
                  <LikeButton item={item} />
                </div>
                <div className="mr-2 text-base px-4 py-2 rounded-full shadow-md">
                  <CommentButton
                    item={item}
                    handleComment={() => {
                      mixpanel.track("Open NFT modal via comment button");
                      this.setState({
                        currentlyOpenModal: true,
                        muted: true,
                        currentlyPlayingVideo: false,
                      });
                    }}
                  />
                </div>
                <div className="mr-2 text-base px-4 py-2 rounded-full shadow-md">
                  <ShareButton
                    url={
                      window.location.protocol +
                      "//" +
                      window.location.hostname +
                      (window.location.port ? ":" + window.location.port : "") +
                      `/t/${item.contract_address}/${item.token_id}`
                    }
                    type={"item"}
                  />
                </div>

                <a
                  href={getBidLink(item)}
                  title={`Buy on ${getContractName(item)}`}
                  target="_blank"
                  onClick={() => {
                    mixpanel.track("OpenSea link click");
                  }}
                >
                  <div className="text-base font-normal px-4 py-3 mr-2 rounded-full shadow-md hover:text-stpink">
                    {`Bid on ${getContractName(item)}`}
                  </div>
                </a>
              </div>
              <div className="flex-grow"></div>
              <div className="flex flex-row pt-4 mt-16 w-full border-t border-gray-200 mb-6">
                {item.contract_is_creator ? (
                  <div className="flex-col flex-1">
                    <div className="flex-shrink pr-2 text-sm text-gray-500">
                      Created by
                    </div>
                    <div className="flex-shrink">
                      <Link
                        href="/c/[collection]"
                        as={`/c/${item.collection_slug}`}
                      >
                        <a className="flex flex-row items-center">
                          <div style={{ width: 30 }}>
                            <img
                              alt={item.collection_name}
                              src={
                                item.collection_img_url
                                  ? item.collection_img_url
                                  : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                              }
                              className="rounded-full"
                              style={{
                                height: 30,
                                width: 30,
                              }}
                            />
                          </div>
                          <div className="showtime-card-profile-link mx-2 md:text-lg">
                            {this.truncateWithEllipses(
                              item.collection_name + " Collection",
                              25
                            )}{" "}
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                ) : item.creator_id ? (
                  <div className="flex-col flex-1">
                    <div className="flex-shrink pr-2  text-sm text-gray-500">
                      {item.owner_id == item.creator_id
                        ? "Created & Owned By"
                        : "Created by"}
                    </div>
                    <div className="flex-shrink">
                      <Link
                        href="/[profile]"
                        as={`/${
                          item?.creator_username || item.creator_address
                        }`}
                      >
                        <a className="flex flex-row items-center">
                          <div>
                            <img
                              alt={item.creator_name}
                              src={
                                item.creator_img_url
                                  ? item.creator_img_url
                                  : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                              }
                              className="rounded-full"
                              style={{
                                height: 30,
                                width: 30,
                              }}
                            />
                          </div>
                          <div className="showtime-card-profile-link ml-2 md:text-lg">
                            {this.truncateWithEllipses(item.creator_name, 30)}
                          </div>
                        </a>
                      </Link>
                    </div>
                  </div>
                ) : null}
                {item.owner_id &&
                (item.owner_id != item.creator_id ||
                  item.contract_is_creator) ? (
                  <div className="flex-1">
                    <div className="flex-shrink pr-2  text-sm text-gray-500">
                      Owned by
                    </div>
                    <div className="text-lg">
                      {item.multiple_owners ? (
                        <span style={{ color: "#888" }}>Multiple owners</span>
                      ) : item.owner_id ? (
                        <Link
                          href="/[profile]"
                          as={`/${item?.owner_username || item.owner_address}`}
                        >
                          <a className="flex flex-row items-center">
                            <div>
                              <img
                                alt={item.owner_name}
                                src={
                                  item.owner_img_url
                                    ? item.owner_img_url
                                    : "https://storage.googleapis.com/opensea-static/opensea-profile/4.png"
                                }
                                className="rounded-full mr-2 "
                                style={{
                                  height: 30,
                                  width: 30,
                                }}
                              />
                            </div>
                            <div className="showtime-card-profile-link">
                              {this.truncateWithEllipses(item.owner_name, 22)}
                            </div>
                          </a>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}
SpotlightItem.contextType = AppContext;

export default SpotlightItem;
