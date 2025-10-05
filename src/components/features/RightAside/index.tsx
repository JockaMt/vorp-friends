import styles from './rightAside.module.css';

export default function RightAside() {
    return (
        <div className={styles.rightSidebar}>
          <aside className={styles.rightAside}>
            <h3 className={styles.rightAsideTitle}>Pedidos de Amizade</h3>
            <p className={styles.rightAsideText}>Você não tem pedidos de amizade novos.</p>
          </aside>
          <aside className={styles.rightAside}>
            <h3 className={styles.rightAsideTitle}>Aniversários</h3>
            <p className={styles.rightAsideText}>Nenhum aniversário próximo.</p>
          </aside>
          <aside className={styles.rightAside}>
            <h3 className={styles.rightAsideTitle}>Eventos</h3>
            <p className={styles.rightAsideText}>Você não está em nenhum evento.</p>
          </aside>
        </div>
    )
}