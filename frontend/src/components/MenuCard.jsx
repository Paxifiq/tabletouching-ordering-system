const MenuCard = ({ item, onAdd }) => {
  const imageUrl = item?.image || 'https://via.placeholder.com/900x675?text=No+Image';

  return (
    <article className="menu-card">
      <img src={imageUrl} alt={item.name} loading="lazy" />
      <div className="card-body">
        <div className="card-top">
          <h3>{item.name}</h3>
          <span className="price">{Number(item.price).toLocaleString()} RWF</span>
        </div>
        <p>{item.description}</p>
        <button className="secondary-button" onClick={onAdd}>+ Add to Cart</button>
      </div>
    </article>
  );
};

export default MenuCard;
