import { useState, useEffect, useContext } from "react";
import _ from "lodash";
import mixpanel from "mixpanel-browser";
import AppContext from "../context/app-context";
import TokenSquareV3 from "./TokenSquareV3";
import TokenHeroV2 from "./TokenHeroV2";

const TokenGridV3 = ({ items, isDetail }) => {
  const context = useContext(AppContext);

  const [itemsList, setItemsList] = useState([]);
  const [itemsLikedList, setItemsLikedList] = useState([]);
  const [myItemLikes, setMyItemLikes] = useState([]);

  useEffect(() => {
    setItemsList(
      items.filter((item) => item.token_hidden !== true && item.token_img_url)
    );
  }, [items]);

  useEffect(() => {
    setMyItemLikes(context.myLikes ? context.myLikes : []);
  }, [context.myLikes]);

  const handleLike = async ({ tid }) => {
    // Update global state via setMyLikes
    context.setMyLikes([...context.myLikes, tid]);

    // Update the like counts for each item on page
    var newItemsList = [...itemsList];
    _.forEach(newItemsList, function (item) {
      if (item.tid === tid) {
        item.like_count = item.like_count + 1;
      }
    });
    setItemsList(newItemsList);

    // Post changes to the API
    await fetch(`/api/like/${tid}`, {
      method: "post",
    });

    mixpanel.track("Liked item");
  };

  const handleUnlike = async ({ tid }) => {
    // Update global state via setMyLikes
    context.setMyLikes(context.myLikes.filter((item) => !(item === tid)));

    // Update the like counts for each item on page
    var newItemsList = [...itemsList];
    _.forEach(newItemsList, function (item) {
      if (item.tid === tid) {
        item.like_count = item.like_count - 1;
      }
    });
    setItemsList(newItemsList);

    // Post changes to the API
    await fetch(`/api/unlike/${tid}`, {
      method: "post",
    });

    mixpanel.track("Unliked item");
  };

  // Augment content with my like status
  useEffect(() => {
    const newItemsLikedList = [];
    _.forEach([...itemsList], function (item) {
      item.liked = false;
      _.forEach([...myItemLikes], function (like) {
        if (item.tid === like) {
          item.liked = true;
        }
      });

      newItemsLikedList.push(item);
    });
    setItemsLikedList(newItemsLikedList);
  }, [itemsList, myItemLikes]);

  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (context.windowSize && context.windowSize.width < 820) {
      setColumns(1);
    } else if (context.windowSize && context.windowSize.width < 1200) {
      setColumns(2);
    } else if (context.windowSize && context.windowSize.width < 1600) {
      setColumns(3);
    } else {
      setColumns(4);
    }
  }, [context.windowSize]);

  return columns ? (
    isDetail ? (
      itemsLikedList && itemsLikedList.length > 0 ? (
        <TokenHeroV2
          item={itemsLikedList[0]}
          handleLike={handleLike}
          handleUnlike={handleUnlike}
          isDetail={isDetail}
        />
      ) : null
    ) : (
      <div
        className={`grid grid-cols-${columns} mx-auto`}
        style={columns === 1 ? null : { width: columns * (375 + 20) }}
      >
        {itemsLikedList.map((item) => {
          return (
            <TokenSquareV3
              key={item.tid}
              item={item}
              handleLike={handleLike}
              handleUnlike={handleUnlike}
              columns={columns}
            />
          );
        })}
      </div>
    )
  ) : null;
};

export default TokenGridV3;